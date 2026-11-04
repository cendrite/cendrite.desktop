import * as Yup from 'yup';

export const VerifyUserValidationSchema = Yup.object({
    verificationCode: Yup.string().matches(/^[0-9]{6}$/, 'Verification code too short').required('Verification code is required'),

})