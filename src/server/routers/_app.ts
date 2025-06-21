/**
 * This file contains the root router of your tRPC-backend
 */
import { createCallerFactory, publicProcedure, router } from '../trpc';
import { transcriptRouter } from './transcript'; // Import the new router

export const appRouter = router({
  healthcheck: publicProcedure.query(() => 'yay!'),

  transcript: transcriptRouter, // Add the new router
});

export const createCaller = createCallerFactory(appRouter);

export type AppRouter = typeof appRouter;
