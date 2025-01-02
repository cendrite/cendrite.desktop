import * as Yup from 'yup';

export const VerifyDeviceValidationSchema = Yup.object<{ deviceVerificationCode: string }>({
    deviceVerificationCode: Yup.string().matches(/^[0-9]{6}$/, 'Verification code too short').required('Verification code is required'),

})