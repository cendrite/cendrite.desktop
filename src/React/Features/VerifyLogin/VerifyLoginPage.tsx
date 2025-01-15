import { useNavigate } from "react-router-dom";
import { VerifyLoginApi } from "./Api/VerifyLoginApi";
import { ResendCodeApi } from "../../Common/Api/ResendVerificationCode/ResendVerificationCodeApi";
import { useState } from "react";
import { CodeType } from "../../Common/Api/ResendVerificationCode/ResendVerificationCodeRequest";
import { Form, Formik, FormikHelpers } from "formik";
import FormButton from "../../Common/Components/FormButton";
import ErrorTooltip from "../../Common/Components/ErrorToolTip";
import { VerifyLoginValidationSchema } from "./Validation/VerifyLoginValidationSchema";
import { useSelector } from "react-redux";
import { RootState } from "../../Redux/Store";

const VerifyLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCooldown, setIsCooldown] = useState(false);
  const [, setCooldownTime] = useState(5);
  const verifyLoginApi = new VerifyLoginApi();
  const resendCodeApi = new ResendCodeApi();
  const loginState = useSelector((state: RootState) => state.login);

  const handleSubmit = async (
    values: { verificationCode: string },
    { setFieldError }: FormikHelpers<{ verificationCode: string }>
  ) => {
    const result = await verifyLoginApi.handle({
      userId: loginState.UserId!,
      loginVerificationCode: values.verificationCode,
    });
    if (result.success) {
      navigate("/home");
    } else {
      console.error(result.errorMessage);
      setFieldError("verificationCode", result.errorMessage!.message);
    }
  };

  const handleResendCode = () => {
    if (isCooldown) return;
    resendCodeApi.handle({ userId: "userId", codeType: CodeType.Login });
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
          validationSchema={VerifyLoginValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, isSubmitting }) => (
            <Form className="flex flex-col items-center w-full">
              <h1 className="text-2xl font-bold text-center underline">verify device</h1>
              <h2 className="text font-semibold mb-12 text-center text-gray-200">
                This is a new device. Please verify your login, by entering the verification code sent to your email.
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

export default VerifyLoginPage;
