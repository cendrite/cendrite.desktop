import * as Yup from 'yup';
import { RegisterFormValues } from '../../Register/Form/RegisterFormValues';

export const VerifyUserValidationSchema = Yup.object<RegisterFormValues>({
    verificationCode: Yup.string().matches(/^[0-9]{6}$/, 'Invalid verification code').required('Verification code is required'),

})