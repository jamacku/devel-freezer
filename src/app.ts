import { debug, error, warning } from '@actions/core';
import { Context, Probot } from 'probot';
import { validateOrReject } from 'class-validator';

import { events } from './events';
import { publishComment } from './comment';
import { getLatestTag, isTagFreezed } from './release';
import { Config } from './config';

const app = (probot: Probot) => {
  probot.on(
    events.pull_request,
    async (context: Context<typeof events.pull_request[number]>) => {
      const config = await Config.getConfig(context);

      // TODO: Make error more useful ; currently:
      // ! {'0': {
      //       target: {
      //         _policy: [
      //           {
      //             _tags: [ '-rc\\d+$' ],
      //             _feedback: { _freezedState: '🥶\n', _unFreezedState: '😎\n' }
      //           },
      //           {
      //             _tags: [ 'alpha', 'beta' ],
      //             _feedback: { _freezedState: 'This is No-No\n' }
      //           }
      //         ]
      //       },
      //       value: [
      //         {
      //           _tags: [ '-rc\\d+$' ],
      //           _feedback: { _freezedState: '🥶\n', _unFreezedState: '😎\n' }
      //         },
      //         {
      //           _tags: [ 'alpha', 'beta' ],
      //           _feedback: { _freezedState: 'This is No-No\n' }
      //         }
      //       ],
      //       property: '_policy',
      //       children: [
      //         {
      //           target: [
      //             {
      //               _tags: [ '-rc\\d+$' ],
      //               _feedback: { _freezedState: '🥶\n', _unFreezedState: '😎\n' }
      //             },
      //             {
      //               _tags: [ 'alpha', 'beta' ],
      //               _feedback: { _freezedState: 'This is No-No\n' }
      //             }
      //           ],
      //           value: {
      //             _tags: [ 'alpha', 'beta' ],
      //             _feedback: { _freezedState: 'This is No-No\n' }
      //           },
      //           property: '1',
      //           children: [
      //             {
      //               target: {
      //                 _tags: [ 'alpha', 'beta' ],
      //                 _feedback: { _freezedState: 'This is No-No\n' }
      //               },
      //               value: { _freezedState: 'This is No-No\n' },
      //               property: '_feedback',
      //               children: [
      //                 {
      //                   target: { _freezedState: 'This is No-No\n' },
      //                   property: '_unFreezedState',
      //                   children: [],
      //                   constraints: { isString: '_unFreezedState must be a string' }
      //                 }
      //               ]
      //             }
      //           ]
      //         }
      //       ]
      //     }
      //   }
      await validateOrReject(config);

      if (!config) {
        error(
          `Missing configuration. Please setup 'devel-freezer' action using 'development-freeze.yml' file.`
        );
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
      debug(
        `The latest tag doesn't match the requirements for a development freeze.`
      );
    }
  );

  probot.on(
    events.release,
    async (context: Context<typeof events.release[number]>) => {
      const config = await Config.getConfig(context);

      if (!config) {
        error(
          `Missing configuration. Please setup 'devel-freezer' action using 'development-freeze.yml' file.`
        );
        return;
      }

      debug(`config: ${config}`);

      // TODO: Get latest tag/release
      const latestTag = getLatestTag(context);

      debug(`latest tag: ${latestTag}`);

      // TODO: Compare latest tag/release with release freeze keywords
      // TODO: If we are out of release freeze then update/hide comment on PR
    }
  );
};

export default app;
