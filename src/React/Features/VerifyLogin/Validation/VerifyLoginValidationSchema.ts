import * as Yup from 'yup';

export const VerifyLoginValidationSchema = Yup.object({
    verificationCode: Yup.string().matches(/^[0-9]{6}$/, 'Verification code too short').required('Verification code is required'),
})