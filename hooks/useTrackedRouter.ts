// hooks/useTrackedRouter.ts
import { useRouter, usePathname } from "expo-router";
import { useNavigationStore } from "@/store/navigationStore";

type PushInput = string | { pathname: string; params?: Record<any, any> };

export const useTrackedRouter = () => {
    const router = useRouter();
    const pathname = usePathname();
    const { pushToBack } = useNavigationStore();

    const extractPathname = (input: PushInput): string => {
        return typeof input === "string" ? input : input.pathname;
    };

    const push = (to: PushInput) => {
        const nextPathname = extractPathname(to);
        if (pathname && pathname !== nextPathname) {
            pushToBack(pathname);
        }
        router.push(to as any); // vẫn an toàn vì expo-router chấp nhận object
    };

    const replace = (to: PushInput) => {
        router.replace(to as any);
    };

    const back = () => {
        router.back();
    };

    return {
        push,
        replace,
        back,
    };
};
