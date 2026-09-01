import { Router } from "express";
import * as controller from "../controllers/requirement.controller";

const router = Router();

router.get("/", controller.listRequirements);
router.post("/", controller.createRequirement);
router.get(":id/audit", controller.listAudit);
router.get(":id", controller.getRequirement);
router.patch(":id", controller.updateRequirement);
router.put(":id", controller.updateRequirement);
router.delete(":id", controller.deleteRequirement);

export default router;
