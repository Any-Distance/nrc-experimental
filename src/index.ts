/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `wrangler dev src/index.ts` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `wrangler publish src/index.ts --name my-worker` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

export interface Env {
    // Example binding to KV. Learn more at https://developers.cloudflare.com/workers/runtime-apis/kv/
    // MY_KV_NAMESPACE: KVNamespace;
    //
    // Example binding to Durable Object. Learn more at https://developers.cloudflare.com/workers/runtime-apis/durable-objects/
    // MY_DURABLE_OBJECT: DurableObjectNamespace;
    //
    // Example binding to R2. Learn more at https://developers.cloudflare.com/workers/runtime-apis/r2/
    // MY_BUCKET: R2Bucket;
}

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        const after = 0; // TODO: pull from url params
        const endpoint = `https://api.nike.com/sport/v3/me/activities/after_time/${after}`;

        // TODO: token should be POSTed; also, only respond to POST
        const token = 'eyJhbGciOiJSUzI1NiIsImtpZCI6ImVkZmY4YTAyLWIyZGEtNDhkZC1iOGVjLThhMmM1MGE2YTM0MnNpZyJ9.eyJpYXQiOjE2NjEzNjE0MjAsImV4cCI6MTY2MTM2NTAyMCwiaXNzIjoib2F1dGgyYWNjIiwianRpIjoiOGE1NzhkY2MtZjY1MS00MGQyLThiNzUtYWNkOTk0YmRhOWVlIiwiYXVkIjoiY29tLm5pa2UuZGlnaXRhbCIsInNidCI6Im5pa2U6YXBwIiwidHJ1c3QiOjEwMCwibGF0IjoxNjYxMzYxNDE5LCJzY3AiOlsibmlrZS5kaWdpdGFsIl0sInN1YiI6ImNvbS5uaWtlLmNvbW1lcmNlLm5pa2Vkb3Rjb20ud2ViIiwicHJuIjoiZjNkYzRlNmMtZmJmYy00YWRlLTgzNWEtYzBiYWFiMTA3MmQ0IiwicHJ0IjoibmlrZTpwbHVzIiwibHJzY3AiOiJvcGVuaWQgbmlrZS5kaWdpdGFsIHByb2ZpbGUgZW1haWwgcGhvbmUgZmxvdyBjb3VudHJ5In0.O8tH47ZCO-tIlODDD1iufEMDvIZYQLsQHbS4hPfiIdkuy160jxBgIcR0HI3UvZFJ5HpcC6BrJ-0UiDRwDWxAxkn7KhHiB5L9ZXvIvpE2CbpEgBjnj9JVKlu1btL1l89p0XNFWzNpffnOemenvZQywy3N5EWw2qLCGVltPlDxsypt1jIiXi287ootyWs2ITxFUVOZWZv6q2xoNH3k18r31-wsdrsekiW9dwn-mT9y1sDciCP95oHQZHRjQT9qXy7fCgVEnue1BHYOui7iWWLaMuW1mWzEMnIuMh58DjlDAKtMTlJ6K_MXNTQ-Pb1q6-85x3F8P6cWYfDYpQ-AEYhX1g';
        const reqHeaders = new Headers({
            'Authorization': `Bearer ${token}`
        });

        // TODO: paging.after_id would be set if there are multiple pages; pulling activity w/ metrics should be a function, maybe
        let activityResp: any = await fetch(endpoint, {
            headers: reqHeaders
        }).then((resp) => resp.json());

        const metricsResp: any = {};
        const metricsPromise = await Promise.all(activityResp['activities'].map((activity) => {
            return fetch(`https://api.nike.com/sport/v3/me/activity/${activity['id']}?metrics=ALL`, {
                headers: reqHeaders
            });
        }));
        const metricsJson = await Promise.all(metricsPromise.map((resp) => resp.json()));

        for (const metric of metricsJson) {
            metricsResp[metric['id']] = metric;
        }

        activityResp['metrics'] = metricsResp;

        return new Response(JSON.stringify(activityResp), {
            headers: {
                'Content-Type': 'application/json'
            }
        });
    },
};
