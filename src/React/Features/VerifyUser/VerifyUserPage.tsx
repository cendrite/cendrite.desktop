import React from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../Redux/Store";

const VerifyUserPage: React.FC = () => {
  const registerState = useSelector((state: RootState) => state.register);

  return (
    <div>
      <h1>Verify User</h1>
      <p>Email: {registerState.email}</p>
      <p>Username: {registerState.username}</p>
      <p>User ID: {registerState.UserId}</p>
    </div>
  );
};

export default VerifyUserPage;
