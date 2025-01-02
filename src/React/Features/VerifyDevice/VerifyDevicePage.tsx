import { Formik, Form, FormikHelpers } from "formik";
import { useNavigate } from "react-router-dom";
import FormButton from "../../Common/Components/FormButton";
import ErrorTooltip from "../../Common/Components/ErrorToolTip";
import { VerifyDeviceApi } from "./Api/VerifyDeviceApi";
import { RootState } from "../../Redux/Store";
import { useSelector } from "react-redux";
import { VerifyDeviceValidationSchema } from "./Validation/VerifyDeviceFormValidation";

const VerifyDevicePage: React.FC = () => {
  const navigate = useNavigate();
  const verifyDeviceApi = new VerifyDeviceApi();
  const loginState = useSelector((state: RootState) => state.login);

  const handleSubmit = async (
    values: { deviceVerificationCode: string },
    { setFieldError }: FormikHelpers<{ deviceVerificationCode: string }>
  ) => {
    const result = await verifyDeviceApi.handle({
      userId: loginState.UserId!,
      deviceId: loginState.DeviceId!,
      deviceVerificationCode: values.deviceVerificationCode,
    });
    if (result.success) {
      // Now we need to naviagete to the home page, but we don't have the home page yet
      // we also need to handle initial nonce request, signing, and token storage, etc etc
    } else {
      console.error(result.errorMessage);
      setFieldError("verificationCode", result.errorMessage!.message);
    }
  };

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-zinc-950 text-white">
      <div className="flex flex-col items-center w-full max-w-xs">
        <Formik
          initialValues={{ deviceVerificationCode: "" }} // Single string to handle all 6 characters
          validationSchema={VerifyDeviceValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, handleChange, isSubmitting }) => (
            <Form className="flex flex-col items-center w-full">
              <h1 className="text-2xl font-bold mb-12 text-center underline">verify your account</h1>

              {/* Error Tooltip Container */}
              <div className="relative w-full flex justify-center">
                {touched.deviceVerificationCode && errors.deviceVerificationCode && (
                  <div className="absolute -top-10">
                    <ErrorTooltip errorMessage={errors.deviceVerificationCode} />
                  </div>
                )}
              </div>
              {/* Input Box */}
              <div className="w-full relative mb-4">
                <input
                  name="verificationCode"
                  type="text"
                  placeholder="Enter verification code"
                  value={values.deviceVerificationCode}
                  onChange={handleChange}
                  className="w-80 h-10 bg-zinc-800 text-white border border-gray-600 rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-white focus:border-gray-700 text-center"
                  maxLength={6}
                  onFocus={e => (e.target.placeholder = "")}
                  onBlur={e => (e.target.placeholder = values.deviceVerificationCode ? "" : "Enter verification code")}
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
      </div>
    </div>
  );
};

export default VerifyDevicePage;
