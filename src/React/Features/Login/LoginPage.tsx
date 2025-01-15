import { useNavigate } from "react-router-dom";
import { LoginApi } from "./Api/LoginApi";
import { Form, Formik, FormikHelpers } from "formik";
import { LoginFormValidation } from "./Validation/LoginFormValidation";
import { InitialFormValues, LoginFieldName, LoginFormValues } from "./FormValues/LoginFormValues";
import InputBox from "../../Common/Components/InputBox";
import ErrorTooltip from "../../Common/Components/ErrorToolTip";
import FormButton from "../../Common/Components/FormButton";
import { AppDispatch } from "../../Redux/Store";
import { useDispatch } from "react-redux";
import { setEmail, setRegisterUserId } from "../../Redux/States/RegisterState";
import { setLoginUserId } from "../../Redux/States/LoginState";

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const loginApi = new LoginApi();
  const dispatch = useDispatch<AppDispatch>();

  const handleLogin = async (values: LoginFormValues, { setFieldError }: FormikHelpers<LoginFormValues>) => {
    const result = await loginApi.handle({
      email: values.email,
      password: values.password,
    });

    if (result.success && result.data) {
      if (result.data!.isVerified === true) {
        dispatch(setLoginUserId(result.data!.userId));
        navigate("/verifyLogin");
      } else if (result.data!.isVerified === false) {
        dispatch(setEmail(values.email));
        dispatch(setRegisterUserId(result.data!.userId));
        navigate("/verifyUser");
      }
    } else {
      setFieldError(LoginFieldName.Email, result.errorMessage!.message);
    }
  };

  const renderErrorTooltip = (error: string | undefined, touched: boolean) =>
    touched && error ? (
      <div className="absolute -top-8 left-0.6 z-50">
        <ErrorTooltip errorMessage={error} />
      </div>
    ) : null;

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-zinc-950 text-white">
      <div className="flex flex-col items-center w-full max-w-xs">
        <Formik
          initialValues={InitialFormValues} // Match the LoginFormValues shape
          validationSchema={LoginFormValidation}
          onSubmit={handleLogin}
        >
          {({ values, errors, touched, handleChange, isSubmitting }) => (
            <Form className="flex flex-col space-y-7 items-center w-full">
              <h1 className="text-2xl font-semibold mb-8 text-center underline">login</h1>

              {/* Email field */}
              <div className="w-full relative mb-4">
                {touched.email && errors.email && renderErrorTooltip(errors.email, touched.email)}
                <InputBox
                  name={LoginFieldName.Email}
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
                  name={LoginFieldName.Password}
                  type="password"
                  placeholder="Enter your password"
                  value={values.password}
                  onChange={handleChange}
                />
              </div>
              <FormButton type="submit" text={isSubmitting ? "Logging in ..." : "Login"} disabled={isSubmitting} />
            </Form>
          )}
        </Formik>
        {/* Navigation link */}
        <div className="mt-4">
          <p>
            Don't have an account?{" "}
            <span className="text-blue-400 cursor-pointer hover:underline" onClick={() => navigate("/register")}>
              Sign up here
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
