# Admin API

Every admin action in the app is reachable over HTTP with an API key, so scripts
and services can do anything an admin can do in the browser.

Keys are created and revoked from **your account menu → API keys**, which appears
in the profile modal for admins only.

## Authentication

Send the key as a bearer token:

```bash
curl https://windowsonarm.org/api/v1/admin/me \
  -H "Authorization: Bearer woa_a1b2c3d4e5f6_..."
```

An `X-API-Key` header is accepted as an alternative, for callers whose proxies
rewrite `Authorization`:

```bash
curl https://windowsonarm.org/api/v1/admin/me \
  -H "X-API-Key: woa_a1b2c3d4e5f6_..."
```

A key is only ever shown once, at creation. There is no endpoint that can return
it again — if you lose it, revoke it and create another.

A key's authority is derived from its owner on every request. Removing someone's
admin role disables all of their keys immediately; no separate revocation sweep
is needed.

### Responses

Every endpoint answers with the same envelope:

```jsonc
{ "success": true,  "data": { /* ... */ } }
{ "success": false, "error": "Admin access required" }
```

Validation failures add an `issues` array naming the offending fields.

| Status | Meaning |
| --- | --- |
| `400` | The payload or query is invalid |
| `401` | No credential, or the key is unknown, malformed, revoked or expired |
| `403` | Valid key, but its owner is not an admin or it lacks the required scope |
| `404` | No such resource — also returned for a key id belonging to another admin |
| `409` | The action conflicts with existing data (duplicate name, resource still in use) |

## Scopes

A key carries only the permissions you grant it. Routes check **leaf** scopes;
`<resource>:*` covers every leaf of that resource, and `admin:*` covers
everything including capabilities added later.

| Scope | Grants |
| --- | --- |
| `posts:read` | Read every app, including the pending review queue |
| `posts:write` | Create and edit apps, and set their status |
| `posts:delete` | Delete apps |
| `blog:read` | Read blog posts, including unpublished drafts |
| `blog:write` | Create and edit blog posts |
| `blog:delete` | Delete blog posts |
| `reviews:read` | Read every review |
| `reviews:delete` | Delete any user's review |
| `taxonomy:read` | Read categories, statuses and tags |
| `taxonomy:write` | Create, edit and delete categories, statuses and tags |
| `keys:read` | List your own API keys |
| `keys:write` | Create, edit and revoke your own API keys |

A key can never grant more than it holds. A key with `keys:write` and
`posts:read` can mint a `posts:read` successor, but not an `admin:*` one — so
narrowing a key cannot be undone from behind that key.

## Endpoints

### Introspection

| Method | Path | Scope |
| --- | --- | --- |
| `GET` | `/api/v1/admin/me` | none — any valid admin credential |

Returns the acting user, whether the call was authenticated by session or key,
the key id, and both the granted and effective (leaf-expanded) scopes. Call this
first to confirm a key works.

### Apps

| Method | Path | Scope |
| --- | --- | --- |
| `GET` | `/api/v1/admin/posts` | `posts:read` |
| `POST` | `/api/v1/admin/posts` | `posts:write` |
| `GET` | `/api/v1/admin/posts/{id}` | `posts:read` |
| `PATCH` | `/api/v1/admin/posts/{id}` | `posts:write` |
| `DELETE` | `/api/v1/admin/posts/{id}` | `posts:delete` |
| `PUT` | `/api/v1/posts/{id}` | `posts:write` |
| `DELETE` | `/api/v1/posts/{id}` | `posts:delete` |

`GET /api/v1/admin/posts` lists **all** apps, pending ones included. Query
params: `cursor`, `category`, `search`, `status`, and `pending=true` for just the
review queue. Paginate by passing the returned `nextCursor` back as `cursor`.

`POST` sets the status directly rather than forcing the app through the pending
queue, and may attribute the app to another user via `user_id`.

`PATCH` is a partial update — send only the fields you want to change. The
existing `PUT /api/v1/posts/{id}` is a full replace and requires the whole
payload. Changing `status_id` re-derives the community-voted effective status.

Approving a pending app is a single call:

```bash
curl -X PATCH https://windowsonarm.org/api/v1/admin/posts/$ID \
  -H "Authorization: Bearer $WOA_KEY" \
  -H "Content-Type: application/json" \
  -d '{"status_id": 1}'
```

### Blog

| Method | Path | Scope |
| --- | --- | --- |
| `GET` | `/api/v1/admin/blog` | `blog:read` |
| `POST` | `/api/v1/blog` | `blog:write` |
| `PUT` | `/api/v1/blog` | `blog:write` |
| `PUT` | `/api/v1/blog/{id}` | `blog:write` |
| `DELETE` | `/api/v1/blog/{id}` | `blog:delete` |

`GET /api/v1/admin/blog` returns drafts as well as published posts; add
`?published=false` for drafts only. The public `GET /api/v1/blog` hard-filters to
published.

### Reviews

| Method | Path | Scope |
| --- | --- | --- |
| `GET` | `/api/v1/admin/reviews` | `reviews:read` |
| `DELETE` | `/api/v1/admin/reviews/{id}` | `reviews:delete` |
| `DELETE` | `/api/v1/posts/{id}/reviews?reviewId=…` | `reviews:delete` |

`GET /api/v1/admin/reviews` lists across every app, filterable by `post_id`,
`user_id` and `rating` — which is how you find one account spamming many apps.
The public route can only list one app at a time.

### Categories, statuses and tags

| Method | Path | Scope |
| --- | --- | --- |
| `GET` | `/api/v1/admin/categories` | `taxonomy:read` |
| `POST` | `/api/v1/admin/categories` | `taxonomy:write` |
| `PUT` | `/api/v1/admin/categories/{id}` | `taxonomy:write` |
| `DELETE` | `/api/v1/admin/categories/{id}` | `taxonomy:write` |
| `GET` | `/api/v1/admin/statuses` | `taxonomy:read` |
| `POST` | `/api/v1/admin/statuses` | `taxonomy:write` |
| `PUT` | `/api/v1/admin/statuses/{id}` | `taxonomy:write` |
| `DELETE` | `/api/v1/admin/statuses/{id}` | `taxonomy:write` |
| `GET` | `/api/v1/admin/tags` | `taxonomy:read` |
| `POST` | `/api/v1/admin/tags` | `taxonomy:write` |
| `PUT` | `/api/v1/admin/tags/{id}` | `taxonomy:write` |
| `DELETE` | `/api/v1/admin/tags/{id}` | `taxonomy:write` |

Listings include a `_count` of the posts attached to each entry.

Two deletions are refused with `409` rather than allowed to cascade:

- A **category** that still holds apps — deleting it would delete those apps
  along with their reviews, upvotes and views. Move them first.
- A **status** still used by any app, and the pending status (id `-1`) always,
  since app creation and the public listing filter both reference it by id.

Deleting a **tag** only detaches it from apps, so it needs no guard.

### API keys

| Method | Path | Scope |
| --- | --- | --- |
| `GET` | `/api/v1/admin/keys` | `keys:read` |
| `POST` | `/api/v1/admin/keys` | `keys:write` |
| `GET` | `/api/v1/admin/keys/{id}` | `keys:read` |
| `PATCH` | `/api/v1/admin/keys/{id}` | `keys:write` |
| `DELETE` | `/api/v1/admin/keys/{id}` | `keys:write` |

Every query is scoped to the calling admin's own keys — one admin can never read
or revoke another's.

```bash
curl -X POST https://windowsonarm.org/api/v1/admin/keys \
  -H "Authorization: Bearer $WOA_KEY" \
  -H "Content-Type: application/json" \
  -d '{
        "name": "Release pipeline",
        "scopes": ["posts:read", "posts:write"],
        "expires_at": "2027-01-01T00:00:00.000Z"
      }'
```

The response is the only place the `token` field ever appears.

`DELETE` revokes rather than deletes, so "which key did this?" stays answerable
afterwards. Revoking an already-revoked key succeeds — the intent holds either
way. A revoked key cannot be re-widened with `PATCH`; create a new one.

## How keys are stored

Only the SHA-256 digest of a token is persisted, so a database leak cannot be
replayed against the API. The `woa_<prefix>_` half is stored in plaintext and
carries a unique index, which is what lets a presented token resolve to one row
without scanning; the secret half is compared as a digest, in constant time.

`last_used_at` is stamped on each authenticated request, outside the response
path — it is bookkeeping, and a failed write there never fails the request.
