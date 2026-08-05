import React, {useState} from "react";
import {CodeType} from "../../../../Electron/Application/Contracts/Enums/CodeType.ts";
import {ResendVerificationCodeCommand} from "../../../../Electron/Application/Features/Authentication/Contracts/ResendVerificationCode.ts";
import {Result} from "../../../../Shared/Result/Result.ts";

interface ResendCodeButtonProps {
    userId: string;
    codeType: CodeType;
}
const ResendCodeButton: React.FC<ResendCodeButtonProps> = ({userId, codeType}) => {
    const [isCooldown, setIsCooldown] = useState(false);
    const [, setCooldownTime] = useState(5);

    const handleResendCode = async () => {
        if (isCooldown) return;

        setIsCooldown(true);
        setCooldownTime(5);

        const resendCodeResult = await window.electron.sendRequestAsync<Result>(
            new ResendVerificationCodeCommand(userId, codeType),
        );

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