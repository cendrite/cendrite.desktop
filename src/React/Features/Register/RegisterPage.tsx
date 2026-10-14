import React from "react";
import {useNavigate} from "react-router-dom";
import {Formik, Form, FormikHelpers} from "formik";
import {RegisterFieldName, RegisterFormValues} from "./Form/RegisterFormValues";
import {initialRegisterValues} from "./Form/InitialRegisterFormValues";
import {RegisterValidationSchema} from "./Validation/RegisterFormValidation";
import {Result} from "../../../Shared/Result/Result.ts";
import {RegisterCommand, RegisterResponse} from "../../../Electron/Application/Features/Authentication/Contracts/Register.ts";
import {useOnboarding} from "../../Context/OnboardingContext.tsx";
import ErrorTooltip from "../../Common/Components/Utility/ErrorToolTip.tsx";
import InputBox from "../../Common/Components/Form/InputBox.tsx";
import FormButton from "../../Common/Components/Form/FormButton.tsx";

const RegisterPage: React.FC = () => {
    const navigate = useNavigate();
    const onBoardingData = useOnboarding();

    const handleSubmit = async (values: RegisterFormValues, {setFieldError}: FormikHelpers<RegisterFormValues>) => {
        const result = await window.electron.sendRequestAsync<Result<RegisterResponse>>(
            new RegisterCommand(values.username, values.email, values.password),
        );
        if (result.success) {
            onBoardingData.updateOnboardingData({email: values.email});
            onBoardingData.updateOnboardingData({username: values.username});
            onBoardingData.updateOnboardingData({UserId: result.data.id});

            navigate("/verifyUser");
        } else {
            if (result.errorMessage.message.includes(RegisterFieldName.Email)) {
                setFieldError(RegisterFieldName.Email, result.errorMessage.message);
            }
        }
    };

    const renderErrorTooltip = (error: string | undefined, touched: boolean) =>
        touched && error ? (
            <div className="absolute -top-8 left-0.6 z-50">
                <ErrorTooltip errorMessage={error}/>
            </div>
        ) : null;

    return (
        <div className="flex flex-col justify-center items-center h-screen bg-canvas text-fg">
            <div className="flex flex-col items-center w-full max-w-xs">
                <Formik
                    initialValues={initialRegisterValues}
                    validationSchema={RegisterValidationSchema}
                    onSubmit={handleSubmit}
                >
                    {({values, errors, touched, handleChange, isSubmitting}) => (
                        <Form className="flex flex-col space-y-7 items-center w-full">
                            <h1 className="text-2xl font-bold mb-8 text-center underline">Register</h1>

                            {/* Username field */}
                            <div className="w-full relative mb-4">
                                {touched.username && errors.username && renderErrorTooltip(errors.username, touched.username)}
                                <InputBox
                                    name={RegisterFieldName.Username}
                                    type="text"
                                    placeholder="Enter your username"
                                    value={values.username}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Email field */}
                            <div className="w-full relative mb-4">
                                {touched.email && errors.email && renderErrorTooltip(errors.email, touched.email)}
                                <InputBox
                                    name={RegisterFieldName.Email}
                                    type="email"
                                    placeholder="Enter your email"
                                    value={values.email}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Password field */}
                            <div className="w-full relative mb-4">
                                {touched.password && errors.password && renderErrorTooltip(errors.password, touched.password)}
                                <InputBox
                                    name={RegisterFieldName.Password}
                                    type="password"
                                    placeholder="Enter your password"
                                    value={values.password}
                                    onChange={handleChange}
                                />
                            </div>

                            {/* Confirm Password field */}
                            <div className="w-full relative mb-4">
                                {touched.confirmPassword &&
                                    errors.confirmPassword &&
                                    renderErrorTooltip(errors.confirmPassword, touched.confirmPassword)}
                                <InputBox
                                    name={RegisterFieldName.ConfirmPassword}
                                    type="password"
                                    placeholder="Confirm your password"
                                    value={values.confirmPassword}
                                    onChange={handleChange}
                                />
                            </div>

                            <FormButton
                                type="submit"
                                text={isSubmitting ? "Registering..." : "Register"}
                                disabled={isSubmitting} // Disable button while submitting
                            />
                        </Form>
                    )}
                </Formik>

                {/* Navigation link */}
                <div className="mt-4">
                    <p>
                        Already have an account?{" "}
                        <span className="text-link cursor-pointer hover:underline"
                              onClick={() => navigate("/login")}>
              login
            </span>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterPage;
