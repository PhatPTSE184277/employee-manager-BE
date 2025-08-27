import { Router } from 'express';
import { ownerTaskController } from '../../controllers/owner/OwnerTaskController';
import { VerifyToken } from '../../middlewares/VerifyToken';

const controller = ownerTaskController;
const router = Router();

router.post('/', VerifyToken, controller.createTask);
router.get('/', VerifyToken, controller.getTasks);
router.get('/:taskId', VerifyToken, controller.getTask);
router.put('/:taskId', VerifyToken, controller.updateTask);
router.delete('/:taskId', VerifyToken, controller.deleteTask);
router.patch('/:taskId/status', VerifyToken, controller.updateTaskStatus);

export default router;
