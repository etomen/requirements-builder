import { Router } from "express";
import * as controller from "../controllers/tag.controller";

const router = Router();

router.get("/", controller.listTags);
router.post("/", controller.createTag);
router.get(":id", controller.getTag);
router.patch(":id", controller.updateTag);
router.put(":id", controller.updateTag);
router.delete(":id", controller.deleteTag);

export default router;
