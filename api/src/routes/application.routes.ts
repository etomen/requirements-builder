import { Router } from "express";
import * as controller from "../controllers/application.controller";

const router = Router();

router.get("/", controller.listApplications);
router.post("/", controller.createApplication);
router.get(":id", controller.getApplication);
router.put(":id", controller.updateApplication);
router.delete(":id", controller.deleteApplication);

export default router;
