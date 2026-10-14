import { useNavigate } from 'react-router-dom';
import React from 'react';
import { Form, Formik, FormikHelpers } from 'formik';
import { VerifyLoginValidationSchema } from './Validation/VerifyLoginValidationSchema';
import { CodeType } from '../../../Shared/Enums/CodeType.ts';
import { useOnboarding } from '../../Context/OnboardingContext.tsx';
import ErrorTooltip from '../../Common/Components/Utility/ErrorToolTip.tsx';
import FormButton from '../../Common/Components/Form/FormButton.tsx';
import ResendCodeButton from '../../Common/Components/Form/ResendCodeButton.tsx';
import { useUser } from '../../Context/User/UserContext.tsx';
import { UserActionType } from '../../Context/User/UserReducer.ts';
import { User } from '../../Models/User.ts';
import { Result } from '../../../Shared/Result/Result.ts';
import { VerifyLoginCommand } from '../../../Shared/Authentication/VerifyLogin.ts';
import { UserContract } from '../../../Shared/Models/UserContract.ts';

const createLocalUserProfile = (userId: string, code: string): Promise<Result<UserContract>> =>
    window.electron.sendRequestAsync<Result<UserContract>>(new VerifyLoginCommand(userId, code));

const VerifyLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const { userDispatch } = useUser();
    const onboardingContext = useOnboarding();

    const handleSubmit = async (
        values: { verificationCode: string },
        { setFieldError }: FormikHelpers<{ verificationCode: string }>,
    ) => {
        const result = await createLocalUserProfile(
            onboardingContext.onboardingData.UserId!,
            values.verificationCode,
        );

        if (!result.success) {
            console.error(result.errorMessage);
            setFieldError('verificationCode', result.errorMessage.message);
            return;
        }

        userDispatch({
            type: UserActionType.Initialize,
            payload: new User(
                result.data.id,
                result.data.username,
                result.data.tag,
                result.data.deviceId,
                result.data.connectionId,
                result.data.externalConnectionIds,
                result.data.avatarKey,
                result.data.displayName,
            ),
        });

        navigate('/home');
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-canvas text-fg">
            <div className="flex flex-col items-center w-full max-w-xs">
                <Formik
                    initialValues={{ verificationCode: '' }} // Single string to handle all 6 characters
                    validationSchema={VerifyLoginValidationSchema}
                    onSubmit={handleSubmit}
                >
                    {({ values, errors, touched, handleChange, isSubmitting }) => (
                        <Form className="flex flex-col items-center w-full">
                            <h1 className="text-2xl font-bold text-center underline">verify device</h1>
                            <h2 className="text font-semibold mb-12 text-center text-fg-muted">
                                This is a new device. Please verify your login, by entering the verification code sent
                                to your email.
                            </h2>

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

                <ResendCodeButton codeType={CodeType.Login} userId={onboardingContext.onboardingData.UserId!} />
            </div>
        </div>
    );
};

export default VerifyLoginPage;
