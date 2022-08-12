import { debug, error, warning } from '@actions/core';
import { validateOrReject } from 'class-validator';
import { events } from './events';
import { publishComment } from './comment';
import { getLatestTag, isTagFreezed } from './release';
import { Config } from './config';
const app = (probot) => {
    probot.on(events.pull_request, async (context) => {
        const config = await Config.getConfig(context);
        await validateOrReject(config);
        if (!config) {
            error(`Missing configuration. Please setup 'devel-freezer' action using 'development-freeze.yml' file.`);
            return;
        }
        const latestTag = await getLatestTag(context);
        if (!latestTag) {
            warning(`Repository doesn't have any tags or releases published.`);
            return;
        }
        debug(`Latest tag is: '${latestTag}'`);
        for (const item of config.policy) {
            if (!isTagFreezed(latestTag, item.tags)) {
                continue;
            }
            await publishComment(item.feedback.freezedState, context);
            return;
        }
        // TODO: If PR is changed and contains metadata from devel-freezer, update comment
        debug(`The latest tag doesn't match the requirements for a development freeze.`);
    });
    probot.on(events.release, async (context) => {
        const config = await Config.getConfig(context);
        if (!config) {
            error(`Missing configuration. Please setup 'devel-freezer' action using 'development-freeze.yml' file.`);
            return;
        }
        debug(`config: ${config}`);
        // TODO: Get latest tag/release
        const latestTag = getLatestTag(context);
        debug(`latest tag: ${latestTag}`);
        // TODO: Compare latest tag/release with release freeze keywords
        // TODO: If we are out of release freeze then update/hide comment on PR
    });
};
export default app;
//# sourceMappingURL=app.js.map