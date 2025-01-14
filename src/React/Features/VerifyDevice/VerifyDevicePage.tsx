import { Formik, Form, FormikHelpers } from "formik";
import FormButton from "../../Common/Components/FormButton";
import ErrorTooltip from "../../Common/Components/ErrorToolTip";
import { VerifyDeviceApi } from "./Api/VerifyDeviceApi";
import { AppDispatch, RootState } from "../../Redux/Store";
import { useDispatch, useSelector } from "react-redux";
import { VerifyDeviceValidationSchema } from "./Validation/VerifyDeviceFormValidation";
import { GetNonceApi } from "./../../Common/Api/Nonce/GetNonceApi";
import { CreateDeviceRequest } from "../../../Electron/Application/Features/Device/Commands/CreateDevice/CreateDeviceRequest";
import { Result } from "../../../Shared/Result/Result";
import { SignNonceDto } from "./../../../Electron/Application/Features/Device/Commands/SignNonce/SignNonceDto";
import { SignNonceRequest } from "./../../../Electron/Application/Features/Device/Commands/SignNonce/SignNonceRequest";
import { VerifyNonceApi } from "../../Common/Api/Nonce/VerifyNonceApi";
import { useNavigate } from "react-router-dom";
import { CreateRefreshTokenRequest } from "./../../../Electron/Application/Features/RefreshToken/Commands/Create/CreateRefreshTokenRequest";
import { setExpiresAt, setJwt, setRefreshToken } from "../../Redux/States/TokenState";

const VerifyDevicePage: React.FC = () => {
  const navigate = useNavigate();
  const verifyDeviceApi = new VerifyDeviceApi();
  const verifyNonceApi = new VerifyNonceApi();
  const getNonceApi = new GetNonceApi();
  const loginState = useSelector((state: RootState) => state.login);
  const dispatch = useDispatch<AppDispatch>();

  // TODO: should refactor this, maybe into a state pattern with compensating actions if something goes wrong, to avoid broken state in fe db an be db.
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
      const device = await window.electron.sendRequestAsync<Result<CreateDeviceRequest>>(
        new CreateDeviceRequest(loginState.DeviceId!, loginState.PublicKey!, loginState.PrivateKey!)
      );

      if (device.success === false) {
        console.error(device.errorMessage);
        setFieldError("deviceVerificationCode", "Something went wrong. Please try again later.");
        return;
      }

      const nonce = await getNonceApi.handle({ UserId: loginState.UserId!, DeviceId: loginState.DeviceId! });

      if (nonce.success === false) {
        console.error(nonce.errorMessage);
        setFieldError("deviceVerificationCode", "Something went wrong. Please try again later.");
        return;
      }

      const signature = await window.electron.sendRequestAsync<Result<SignNonceDto>>(
        new SignNonceRequest(nonce.data!.nonceValue)
      );

      if (signature.success === false) {
        console.error(signature.errorMessage);
        setFieldError("deviceVerificationCode", "Something went wrong. Please try again later.");
        return;
      }

      const signatureValidationResult = await verifyNonceApi.handle({
        userId: loginState.UserId!,
        nonceId: nonce.data!.nonceId,
        deviceId: loginState.DeviceId!,
        nonce: signature.data!.signature,
      });

      if (signatureValidationResult.success === false) {
        console.error(signatureValidationResult.errorMessage);
        setFieldError("deviceVerificationCode", "Something went wrong. Please try again later.");
        return;
      }
      dispatch(setJwt(signatureValidationResult.data!.jwt));
      dispatch(setRefreshToken(signatureValidationResult.data!.refreshToken));
      dispatch(setExpiresAt(new Date(signatureValidationResult.data!.expiresAt)));

      const tokenCreateResult = await window.electron.sendRequestAsync<Result>(
        new CreateRefreshTokenRequest(
          signatureValidationResult.data!.refreshToken,
          signatureValidationResult.data!.expiresAt
        )
      );

      if (tokenCreateResult.success === false) {
        console.error(tokenCreateResult.errorMessage);
        setFieldError("deviceVerificationCode", "Something went wrong. Please try again later.");
        return;
      }

      console.log("Everything worked beautifulyy");

      navigate("/homePage");
    } else {
      console.error(result.errorMessage);
      setFieldError("deviceVerificationCode", result.errorMessage!.message);
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
              <h1 className="text-2xl font-bold mb-12 text-center underline">verify your device</h1>

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
                  name="deviceVerificationCode"
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
                text={isSubmitting ? "Verifying device..." : "Verify"}
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
