import {CodeType, ResendCodeApi} from "../Api/Identity/User/ResendVerificationCodeApi.ts";
import React, {useState} from "react";

interface ResendCodeButtonProps {
    userId: string;
    codeType: CodeType;
}
const ResendCodeButton: React.FC<ResendCodeButtonProps> = ({userId, codeType}) => {
    const [isCooldown, setIsCooldown] = useState(false);
    const [, setCooldownTime] = useState(5);
    const resendCodeApi = new ResendCodeApi();

    const handleResendCode = async () => {
        if (isCooldown) return;

        setIsCooldown(true);
        setCooldownTime(5);

        const resendCodeResult = await resendCodeApi.resendCode({
            userId: userId,
            codeType: codeType,
        });

        if (!resendCodeResult.success) {
            console.error(resendCodeResult.errorMessage);
            setIsCooldown(false);
            return;
        }

        const interval = setInterval(() => {
            setCooldownTime((prev) => {
                if (prev === 0) {
                    setIsCooldown(false);
                    clearInterval(interval);
                    return 5;
                }
                return prev - 1;
            });
        }, 1000);
    };

    return (
        <div className="mt-4">
            <p>
                Didn't receive the code?{" "}
                <span
                    className={`text-blue-400 cursor-pointer ${
                        isCooldown ? "opacity-50 cursor-not-allowed" : "hover:underline"
                    }`}
                    onClick={handleResendCode}>
                    {isCooldown ? "sending code" : "Press to resend"}
                </span>
            </p>
        </div>
    );
};

export default ResendCodeButton;