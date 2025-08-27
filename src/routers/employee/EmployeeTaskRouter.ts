import { Router } from 'express';
import { employeeTaskController } from '../../controllers/employee/EmployeeTaskController';
import { VerifyToken } from '../../middlewares/VerifyToken';

const controller = employeeTaskController;
const router = Router();

router.get('/', VerifyToken, controller.getMyTasks);
router.get('/stats', VerifyToken, controller.getTaskStats);
router.get('/:taskId', VerifyToken, controller.getMyTask);
router.patch('/:taskId/status', VerifyToken, controller.updateTaskStatus);

export default router;
