import { ReactNode, useState } from 'react';
import { Colors } from '../../../app/Colors';
import { t } from 'homebase-id-app-common';
import TextButton from '../Text/Text-Button';

export const Expander = ({
  abstract,
  children,
  allowExpand,
}: {
  abstract: ReactNode;
  children: ReactNode;
  allowExpand: boolean;
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <>
      {!isExpanded ? (
        <>
          {abstract}
          {allowExpand ? (
            <>
              <TextButton
                unFilledStyle={{
                  marginLeft: 4,
                  alignItems: 'flex-start',
                }}
                textStyle={{ color: Colors.purple[500], fontSize: 16 }}
                title={t('More')}
                onPress={() => setIsExpanded(true)}
              />
            </>
          ) : null}
        </>
      ) : (
        <>
          {children}
          <TextButton
            unFilledStyle={{
              marginLeft: 4,
              alignItems: 'flex-start',
            }}
            textStyle={{ color: Colors.purple[500], fontSize: 16 }}
            title={t('Less')}
            onPress={() => setIsExpanded(false)}
          />
        </>
      )}
    </>
  );
};
