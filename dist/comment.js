import { debug } from 'console';
import { getMetadata, setMetadata } from './metadata';
import { warning } from '@actions/core';
const develFreezerCommentID = 'devel-freezer-comment-id';
export async function publishComment(content, context) {
    var _a;
    const commentID = await getCommentID(context);
    if (commentID) {
        updateComment(commentID, content, context);
        return;
    }
    const commentPayload = (_a = (await createComment(content, context))) === null || _a === void 0 ? void 0 : _a.data;
    if (!commentPayload) {
        warning(``);
        return;
    }
    await setCommentID(commentPayload.id, context);
}
async function getCommentID(context) {
    return getMetadata(develFreezerCommentID, context);
}
async function setCommentID(id, context) {
    debug(`id: '${id}'`);
    await setMetadata(develFreezerCommentID, id.toString(), context);
}
function createComment(body, context) {
    if (!body || body === '')
        return;
    return context.octokit.issues.createComment(context.issue({
        body,
    }));
}
async function updateComment(commentID, body, context) {
    return context.octokit.issues.updateComment(context.issue({
        comment_id: commentID,
        body,
    }));
}
//# sourceMappingURL=comment.js.map