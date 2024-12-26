import * as Yup from 'yup';
import { RegisterFormValues } from '../../Register/Form/RegisterFormValues';

export const VerifyUserValidationSchema = Yup.object<RegisterFormValues>({
    verificationCode: Yup.string().matches(/^[0-9]{6}$/, 'Verification code too short').required('Verification code is required'),

})