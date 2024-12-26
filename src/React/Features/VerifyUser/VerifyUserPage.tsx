/* eslint-disable @typescript-eslint/no-explicit-any */
import { Formik, Form, Field } from "formik";
import React from "react";
import { useNavigate } from "react-router-dom";
import { VerifyUserValidationSchema } from "./Validation/VerifyUserFormValidation";
import { VerifyUserApi } from "./Api/VerifyUserApi";
import ErrorTooltip from "../../Common/Components/ErrorToolTip";
import Button from "../../Common/Components/FormButton";
import { store } from "../../Redux/Store";
import { backTrackInput, focusNextInput, inhibitNonNumericInput } from "./Helpers/Input";

const VerificationPage: React.FC = () => {
  const navigate = useNavigate();
  const registerState = store.getState().register;
  console.log(registerState.UserId);

  const verifyUserApi = new VerifyUserApi();

  const handleSubmit = async (values: any) => {
    console.log(registerState.UserId);
    const result = await verifyUserApi.handle({
      userId: registerState.UserId!,
      verificationCode: values.verificationCode,
    });
    if (result.success) {
      navigate("/login");
    } else {
      console.log(result.errorMessage);
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    index: number,
    values: any,
    setFieldValue: any
  ) => {
    const value = e.target.value;
    const updatedVerificationCode = values.verificationCode.split("");

    updatedVerificationCode[index] = value;

    setFieldValue("verificationCode", updatedVerificationCode.join(""));
    focusNextInput(index, 6, e);
  };

  return (
    <div className="flex justify-center items-center h-screen bg-stone-900 text-white">
      <div className="w-full max-w-md mx-auto">
        <Formik
          initialValues={{ verificationCode: "" }} // Single string to handle all 6 characters
          validationSchema={VerifyUserValidationSchema}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, isSubmitting }) => (
            <Form className="flex flex-col items-center w-full">
              {/* Verification Code Input Boxes */}

              {/* Error Tooltip Container */}
              <div className="relative w-full flex justify-center">
                {touched.verificationCode && errors.verificationCode && (
                  <div className="absolute -top-10">
                    <ErrorTooltip errorMessage={errors.verificationCode} />
                  </div>
                )}
              </div>

              <div className="flex space-x-3">
                {[...Array(6)].map((_, index) => (
                  <div key={index}>
                    <Field
                      name={`verificationCode[${index}]`}
                      type="text"
                      maxLength={1}
                      className="w-12 h-12 text-center bg-stone-800 text-white border border-gray-600 focus:border-blue-500 focus:ring focus:ring-blue-500 focus:ring-opacity-50 focus:outline-none rounded-md"
                      value={values.verificationCode[index] || ""}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                        handleInputChange(e, index, values, setFieldValue)
                      }
                      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
                        backTrackInput(index, e);
                        inhibitNonNumericInput(e);
                      }}
                      id={`code-${index}`}
                    />
                  </div>
                ))}
              </div>

              {/* Submit button */}
              <div className="w-60 pt-5">
                <Button
                  type="submit"
                  text={isSubmitting ? "Verifying..." : "Verify"}
                  disabled={isSubmitting || values.verificationCode.length < 6}
                />
              </div>
            </Form>
          )}
        </Formik>
      </div>
    </div>
  );
};

export default VerificationPage;
