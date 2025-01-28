import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { Form, Formik, FormikHelpers } from "formik";
import FormButton from "../../Common/Components/FormButton";
import ErrorTooltip from "../../Common/Components/ErrorToolTip";
import { VerifyLoginValidationSchema } from "./Validation/VerifyLoginValidationSchema";
import { useSelector } from "react-redux";
import { RootState } from "../../Redux/Store";
import { Result } from "../../../Shared/Result/Result";
import { GenerateKeysRequest } from "./../../../Electron/Application/Features/Device/Commands/GenerateKeys/GenerateKeysRequest";
import { GenerateKeysDto } from "./../../../Electron/Application/Features/Device/Commands/GenerateKeys/GenerateKeysDto";
import { CreateDeviceRequest } from "../../../Electron/Application/Features/Device/Commands/CreateDevice/CreateDeviceRequest";
import { TokenManager } from "../../Token/TokenManager";
import {UserProfileService} from "./Services/UserProfileService.ts";
import {useUser} from "../../Common/Context/UserContext.tsx";
import {VerifyLoginApi} from "../../Common/Api/Identity/Auth/VerifyLoginApi.ts";
import {CodeType, ResendCodeApi} from "../../Common/Api/Identity/User/ResendVerificationCodeApi.ts";
import {CreateDeviceApi} from "../../Common/Api/Identity/User/CreateDeviceApi.ts";

const VerifyLoginPage: React.FC = () => {
  const navigate = useNavigate();
  const [isCooldown, setIsCooldown] = useState(false); // TODO: move to a hook 1
  const [, setCooldownTime] = useState(5); // TODO: move to a hook 1
  const tokenManager = TokenManager.getInstance();
  const verifyLoginApi = new VerifyLoginApi();
  const resendCodeApi = new ResendCodeApi(); // TODO: move to a hook 1
  const createDeviceApi = new CreateDeviceApi(); // TODO: move to a service class with the related electron call
  const userProfileService = new UserProfileService();
  const loginState = useSelector((state: RootState) => state.login);
  const { setUser } = useUser();


  const handleSubmit = async (
    values: { verificationCode: string },
    { setFieldError }: FormikHelpers<{ verificationCode: string }>
  ) => {
    const result = await verifyLoginApi.verifyLogin({
      userId: loginState.UserId!,
      loginVerificationCode: values.verificationCode,
    });
    //TODO refactor to guard clause
    if (result.success) {
      const keys = await window.electron.sendRequestAsync<Result<GenerateKeysDto>>(new GenerateKeysRequest());

      // remove console logs
      console.log("LoginNonceId: ", result.data!.nonceId);
      console.log("LoginNonce: ", result.data!.nonce);
      console.log("DevicePublicKey: ", keys.data!.publicKey);
      console.log("DevicePrivateKey: ", keys.data!.privateKey);

      const crtDevResult = await createDeviceApi.createDevice({
        userId: loginState.UserId!,
        loginNonceId: result.data!.nonceId,
        loginNonce: result.data!.nonce,
        deviceAppVersion: "1.0",
        deviceType: 1,
        devicePlatform: 1,
        base64DevicePublicKey: keys.data!.publicKey,
      });

      if (!crtDevResult.success) {
        console.error(crtDevResult.errorMessage);
        setFieldError("verificationCode", "Something went wrong. Please try again later.");
        return;
      }

      const device = await window.electron.sendRequestAsync<Result>(
        new CreateDeviceRequest(crtDevResult.data!.deviceId, keys.data!.publicKey, keys.data!.privateKey)
      );

      tokenManager.setUserId(loginState.UserId!);
      tokenManager.setDeviceId(crtDevResult.data!.deviceId);

      if (!device.success) {
        console.error(device.errorMessage);
        setFieldError("verificationCode", "Something went wrong. Please try again later.");
        return;
      }

      await tokenManager.initializeTokens();

      const userProfileResult = await  userProfileService.HandleUserProfile(loginState.UserId!);
      setUser({
        id: userProfileResult!.id,
        username: userProfileResult!.username,
        userTag: userProfileResult!.userTag,
        profilePictureUrl: userProfileResult!.profilePictureUrl,
        displayName: userProfileResult!.displayName,
        deviceId: crtDevResult.data!.deviceId,
      });

      navigate("/home");
    } else {
      console.error(result.errorMessage);
      setFieldError("verificationCode", result.errorMessage!.message);
    }
  };

  const handleResendCode = () => {
    if (isCooldown) return;
    resendCodeApi.resendCode({ userId: loginState.UserId!, codeType: CodeType.Login });
    setIsCooldown(true);
    setCooldownTime(7);

    const interval = setInterval(() => {
      setCooldownTime(prev => prev - 1);
    }, 1000);

    setTimeout(() => {
      clearInterval(interval);
      setIsCooldown(false);
    }, 5000);
  }; // TODO: move to a hook 1

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
