import { IntroductionGroup, sendIntroduction } from '@homebase-id/js-lib/network';
import { useMutation } from '@tanstack/react-query';
import { useDotYouClientContext } from 'homebase-id-app-common';


export const useIntroductions = () => {
    const dotYouClient = useDotYouClientContext();

    const introduce = async (introduction: IntroductionGroup) =>
        sendIntroduction(dotYouClient, introduction);

    return {
        introduceIdentities: useMutation({
            mutationFn: introduce,
            onError: (error) => {
                console.error('[useIntroductions:introduceIdentities]', error);
                // throw error;
            },
        }),
    };
};
