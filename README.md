# Getting Started 

## Starting lqtmdev (api) server bash commands
```
cp .env.example .env   // Copy .env.example to .env: 
docker-compose up      // Starts the mongo db
npm run seed           // Seeds data in the db
npm run dev            // Starts the api server
```

## Starting race-results (frontend results) 
// Note: These commands reference the race-results repo. Run these commands in that folder!
```
npm run dev            // Starts the vite dev server
```

## Available Scripts
In the project directory, you can run:

### `npm run dev`

To start the app in dev mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

### `npm start`

For production mode (will require production environment setup)

### `npm run test`

Run the test cases.

## Learn More

To learn Fastify, check out the [Fastify documentation](https://www.fastify.io/docs/latest/).

## TODO  
- rescore  - 30	Louis	Gaultney should be expert 39- for race 4/6
- 43 last race, 405 this race - SS sport 4/6 result needs to be moved
- http://localhost:3000/#/race/33cjb7f8l1y6pa46
