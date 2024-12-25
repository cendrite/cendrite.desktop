import React from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../Redux/Store";
import { Formik } from "formik";
import { InitialVerifyUserValues } from "./Form/InitialVerifyUserValues";
import { VerifyUserValidationSchema } from "./Validation/VerifyUserFormValidation";

const VerifyUserPage: React.FC = () => {
  const registerState = useSelector((state: RootState) => state.register);

  const handleSubmit = () => {};

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-zinc-950 text-white">
      <div className="flex flex-col items-center w-full max-w-xs">
        <Formik
          initialValues={InitialVerifyUserValues}
          validationSchema={VerifyUserValidationSchema}
          onSubmit={handleSubmit}
        ></Formik>
      </div>
    </div>
  );
};

export default VerifyUserPage;
