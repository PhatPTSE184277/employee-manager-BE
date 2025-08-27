import { Router } from 'express';
import ownerAuthRouter from './OwnerAuthRouter';
import employeeManagementRouter from './OwnerEmployeeRouter';
import taskRouter from './OwnerTaskRouter';

const router = Router();

router.use('/auth', ownerAuthRouter);
router.use('/employees', employeeManagementRouter);
router.use('/tasks', taskRouter);

export default router;
