import { Router, type IRouter } from "express";
import healthRouter from "./health";
import prayerRouter from "./prayer";

const router: IRouter = Router();

router.use(healthRouter);
router.use(prayerRouter);

export default router;
