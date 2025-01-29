import {useNavigate} from "react-router-dom";
import React from "react";
import {Form, Formik, FormikHelpers} from "formik";
import FormButton from "../../Common/Components/FormButton";
import ErrorTooltip from "../../Common/Components/ErrorToolTip";
import {VerifyLoginValidationSchema} from "./Validation/VerifyLoginValidationSchema";
import {TokenManager} from "../../Token/TokenManager";
import {UserProfileService} from "./Services/UserProfileService.ts";
import {VerifyLoginApi} from "../../Common/Api/Identity/Auth/VerifyLoginApi.ts";
import {DeviceService} from "./Services/CreateDeviceService.ts";
import ResendCodeButton from "../../Common/Components/ResendCodeButton.tsx";
import {CodeType} from "../../Common/Api/Identity/User/ResendVerificationCodeApi.ts";
import {useUser} from "../../Common/Context/UserContext.tsx";
import {useOnboarding} from "../../Common/Context/OnboardingContext.tsx";

const VerifyLoginPage: React.FC = () => {
    const navigate = useNavigate();
    const tokenManager = TokenManager.getInstance();
    const verifyLoginApi = new VerifyLoginApi();
    const userProfileService = new UserProfileService();
    const deviceService = new DeviceService();
    const userContext = useUser();
    const onboardingContext = useOnboarding();


    const handleSubmit = async (values: { verificationCode: string },
        {setFieldError}: FormikHelpers<{ verificationCode: string }>
    ) => {
        const verifyLoginResult = await verifyLoginApi.verifyLogin({
            userId: onboardingContext.onboardingData.UserId!,
            loginVerificationCode: values.verificationCode,
        });

        if (!verifyLoginResult.success) {
            console.error(verifyLoginResult.errorMessage);
            setFieldError("verificationCode", verifyLoginResult.errorMessage!.message);
            return;
        }

        const deviceRegistrationResult = await deviceService.HandleDeviceRegistration(
            onboardingContext.onboardingData.UserId!,
            verifyLoginResult.data!.nonceId,
            verifyLoginResult.data!.nonce);

        if (!deviceRegistrationResult.success) {
            console.error(deviceRegistrationResult.errorMessage);
            setFieldError("verificationCode", "Something went wrong. Please try again later.");
            return;
        }

        console.log("USER ONBOARDING DATA", onboardingContext.onboardingData);
        console.log("DEVICE REGISTRATION RESULT", deviceRegistrationResult);
        await tokenManager.initialize(onboardingContext.onboardingData.UserId!, deviceRegistrationResult.data!);

        const userProfileResult = await userProfileService.HandleUserProfile(onboardingContext.onboardingData.UserId!);
        userContext.setUser({
            id: userProfileResult!.id,
            username: userProfileResult!.username,
            userTag: userProfileResult!.userTag,
            profilePictureUrl: userProfileResult!.profilePictureUrl,
            displayName: userProfileResult!.displayName,
            deviceId: deviceRegistrationResult.data!,
        });

        navigate("/home");
    };

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-zinc-950 text-white">
            <div className="flex flex-col items-center w-full max-w-xs">
                <Formik
                    initialValues={{verificationCode: ""}} // Single string to handle all 6 characters
                    validationSchema={VerifyLoginValidationSchema}
                    onSubmit={handleSubmit}
                >
                    {({values, errors, touched, handleChange, isSubmitting}) => (
                        <Form className="flex flex-col items-center w-full">
                            <h1 className="text-2xl font-bold text-center underline">verify device</h1>
                            <h2 className="text font-semibold mb-12 text-center text-gray-200">
                                This is a new device. Please verify your login, by entering the verification code sent
                                to your email.
                            </h2>

                            {/* Error Tooltip Container */}
                            <div className="relative w-full flex justify-center">
                                {touched.verificationCode && errors.verificationCode && (
                                    <div className="absolute -top-10">
                                        <ErrorTooltip errorMessage={errors.verificationCode}/>
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
                                    className="w-80 h-10 bg-zinc-800 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-white focus:border-gray-700 text-center"
                                    maxLength={6}
                                    onFocus={e => (e.target.placeholder = "")}
                                    onBlur={e => (e.target.placeholder = values.verificationCode ? "" : "Enter verification code")}
                                />
                            </div>

                            {/* Submit button */}
                            <FormButton
                                type="submit"
                                text={isSubmitting ? "Registering..." : "Register"}
                                disabled={isSubmitting} // Disable button while submitting
                            />
                        </Form>
                    )}
                </Formik>

                <ResendCodeButton
                    codeType={CodeType.Login}
                    userId={onboardingContext.onboardingData.UserId!}/>
            </div>
        </div>
    );
};

export default VerifyLoginPage;
