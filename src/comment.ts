import { Context } from 'probot';
import { debug } from 'console';

import { events } from './events';
import { getMetadata, setMetadata } from './metadata';
import { warning } from '@actions/core';

const develFreezerCommentID = 'devel-freezer-comment-id';

export async function publishComment(
  content: string,
  context: {
    [K in keyof typeof events]: Context<typeof events[K][number]>;
  }[keyof typeof events]
) {
  const commentID = await getCommentID(context);

  if (commentID) {
    updateComment(commentID, content, context);
    return;
  }

  const commentPayload = (await createComment(content, context))?.data;

  if (!commentPayload) {
    warning(``);
    return;
  }

  await setCommentID(commentPayload.id, context);
}

async function getCommentID(
  context: {
    [K in keyof typeof events]: Context<typeof events[K][number]>;
  }[keyof typeof events]
): Promise<number | undefined> {
  return getMetadata(develFreezerCommentID, context as unknown as Context);
}

async function setCommentID(
  id: number,
  context: {
    [K in keyof typeof events]: Context<typeof events[K][number]>;
  }[keyof typeof events]
) {
  debug(`id: '${id}'`);

  await setMetadata(
    develFreezerCommentID,
    id.toString(),
    context as unknown as Context
  );
}

function createComment(
  body: string,
  context: {
    [K in keyof typeof events]: Context<typeof events[K][number]>;
  }[keyof typeof events]
) {
  if (!body || body === '') return;

  return context.octokit.issues.createComment(
    context.issue({
      body,
    })
  );
}

async function updateComment(
  commentID: number,
  body: string,
  context: {
    [K in keyof typeof events]: Context<typeof events[K][number]>;
  }[keyof typeof events]
) {
  return context.octokit.issues.updateComment(
    context.issue({
      comment_id: commentID,
      body,
    })
  );
}
