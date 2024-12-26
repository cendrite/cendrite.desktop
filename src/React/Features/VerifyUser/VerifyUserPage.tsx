/* eslint-disable @typescript-eslint/no-explicit-any */
import { Formik, Form, FormikHelpers } from "formik";
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { VerifyUserValidationSchema } from "./Validation/VerifyUserFormValidation";
import { VerifyUserApi } from "./Api/Verify/VerifyUserApi";
import ErrorTooltip from "../../Common/Components/ErrorToolTip";
import FormButton from "../../Common/Components/FormButton";
import { ResendCodeApi } from "./Api/ResendCode/ResendCodeApi";
import { useSelector } from "react-redux";
import { RootState } from "../../Redux/Store";

const VerifyUserPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCooldown, setIsCooldown] = useState(false);
  const [, setCooldownTime] = useState(5);
  const verifyUserApi = new VerifyUserApi();
  const resendCodeApi = new ResendCodeApi();
  const registerState = useSelector((state: RootState) => state.register);

  const handleSubmit = async (
    values: { verificationCode: string },
    { setFieldError }: FormikHelpers<{ verificationCode: string }>
  ) => {
    const result = await verifyUserApi.handle({
      userId: registerState.UserId!,
      verificationCode: values.verificationCode,
    });
    if (result.success) {
      navigate("/login");
    } else {
      console.error(result.errorMessage);
      setFieldError("verificationCode", result.errorMessage!.message);
    }
  };

  const handleResendCode = () => {
    if (isCooldown) return;
    resendCodeApi.handle({ userId: registerState.UserId! });
    setIsCooldown(true);
    setCooldownTime(7);

    const interval = setInterval(() => {
      setCooldownTime(prev => prev - 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      setIsCooldown(false);
    }, 5000);
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-zinc-950 text-white">
      <div className="flex flex-col items-center w-full max-w-xs">
        <Formik
          initialValues={{ verificationCode: "" }} // Single string to handle all 6 characters
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

        {/* Resend link */}
        <div className="mt-4">
          <p>
            Lost your code?{" "}
            <span
              className={`text-blue-400 cursor-pointer ${
                isCooldown ? "opacity-50 cursor-not-allowed" : "hover:underline"
              }`}
              onClick={handleResendCode}
            >
              {isCooldown ? "sending verification code" : "Press to resend"}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyUserPage;
