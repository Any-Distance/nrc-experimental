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

}

export default {
    async fetch(
        request: Request,
        env: Env,
        ctx: ExecutionContext
    ): Promise<Response> {
        const { searchParams } = new URL(request.url);
        const after = searchParams?.get("after") || 0;
        const endpoint = `https://api.nike.com/sport/v3/me/activities/after_time/${after}`;

        const token = request.body; // TODO: pull from POSTdata, also only respond to POST
        const reqHeaders = new Headers({
            'Authorization': `Bearer ${token}`
        });

        // TODO: paging.after_id would be set if there are multiple pages
        let activityResp: any = await fetch(endpoint, {
            headers: reqHeaders
        }).then((resp) => resp.json());

        if (activityResp.errors.length) {
            return new Response(JSON.stringify({ errors: activityResp.errors }), {
                headers: {
                    'Content-Type': 'application/json'
                }
            });
        }

        const metricsResp: any = {};

        // TODO: is this ever paginated?
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
