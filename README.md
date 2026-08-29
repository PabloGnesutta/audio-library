# audiolibrary backend

## Project setup

Node: developed/tested on v24 (nvm: `nvm use` picks up `.nvmrc`). Any
Node >= 20 should work.

Copy `.env.example` to `.env` and fill in real values (DB, S3, SendGrid,
SECRET_KEY) before running — the server boots without them but nothing
that touches the database, storage, or email will work.

```
npm install
```
