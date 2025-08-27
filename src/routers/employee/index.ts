import { Router } from 'express';
import employeeAuthRouter from './EmployeeAuthRouter';
import employeeProfileRouter from './EmployeeProfileRouter';
import employeeTaskRouter from './EmployeeTaskRouter';

const router = Router();

router.use('/auth', employeeAuthRouter);
router.use('/profile', employeeProfileRouter);
router.use('/tasks', employeeTaskRouter);

export default router;
