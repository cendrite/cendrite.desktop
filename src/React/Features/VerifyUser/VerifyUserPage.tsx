import { Formik, Form, FormikHelpers } from 'formik';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { VerifyUserValidationSchema } from './Validation/VerifyUserFormValidation';
import { CodeType } from '../../../Electron/Application/Contracts/Enums/CodeType.ts';
import { VerifyUserCommand } from '../../../Electron/Application/Features/Authentication/Contracts/VerifyUser.ts';
import { Result } from '../../../Shared/Result/Result.ts';
import { useOnboarding } from '../../Context/OnboardingContext.tsx';
import ErrorTooltip from '../../Common/Components/Utility/ErrorToolTip.tsx';
import FormButton from '../../Common/Components/Form/FormButton.tsx';
import ResendCodeButton from '../../Common/Components/Form/ResendCodeButton.tsx';

const VerifyUserPage: React.FC = () => {
    const navigate = useNavigate();
    const onboardingContext = useOnboarding();

    const handleSubmit = async (
        values: { verificationCode: string },
        { setFieldError }: FormikHelpers<{ verificationCode: string }>,
    ) => {
        const result = await window.electron.sendRequestAsync<Result>(
            new VerifyUserCommand(onboardingContext.onboardingData.UserId!, values.verificationCode),
        );
        if (result.success) {
            navigate('/login');
        } else {
            console.error(result.errorMessage);
            setFieldError('verificationCode', result.errorMessage.message);
        }
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-canvas text-fg">
            <div className="flex flex-col items-center w-full max-w-xs">
                <Formik
                    initialValues={{ verificationCode: '' }} // Single string to handle all 6 characters
                    validationSchema={VerifyUserValidationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ values, errors, touched, handleChange, isSubmitting }) => (
                        <Form className="flex flex-col items-center w-full">
                            <h1 className="text-2xl font-bold mb-12 text-center underline">verify your account</h1>

                            {/* Verification Code Input Boxes */}

                            {/* Error Tooltip Container */}
                            <div className="relative w-full flex justify-center">
                                {touched.verificationCode && errors.verificationCode && (
                                    <div className="absolute -top-10">
                                        <ErrorTooltip errorMessage={errors.verificationCode} />
                                    </div>
                                )}
                            </div>
                            {/* Input Boxes */}
                            <div className="w-full relative mb-4">
                                <input
                                    name="verificationCode"
                                    type="text"
                                    placeholder="Enter verification code"
                                    value={values.verificationCode}
                                    onChange={handleChange}
                                    className="w-80 h-10 bg-field text-fg border border-line-strong rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-fg focus:border-line-strong text-center"
                                    maxLength={6}
                                    onFocus={(e) => (e.target.placeholder = '')}
                                    onBlur={(e) =>
                                    (e.target.placeholder = values.verificationCode
                                        ? ''
                                        : 'Enter verification code')
                                    }
                                />
                            </div>

                            {/* Submit button */}
                            <FormButton
                                type="submit"
                                text={isSubmitting ? 'Registering...' : 'Register'}
                                disabled={isSubmitting} // Disable button while submitting
                            />
                        </Form>
                    )}
                </Formik>

                <ResendCodeButton
                    userId={onboardingContext.onboardingData.UserId!}
                    codeType={CodeType.EmailVerification}
                />
            </div>
        </div>
    );
};

export default VerifyUserPage;
