import React, { useMemo } from 'react';
import {
  Text,
  View,
  StyleProp,
  ViewStyle,
  TextStyle,
  StyleSheet,
} from 'react-native';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import calendar from 'dayjs/plugin/calendar';

import { DATE_FORMAT } from './Constant';
import { useChatContext } from './GiftedChatContext';
import Color from './Color';

export interface DayProps {
  createdAt: Date | number;
  dateFormat?: string;
  dateFormatCalendar?: object;
  containerStyle?: StyleProp<ViewStyle>;
  wrapperStyle?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
}

const stylesCommon = StyleSheet.create({
  centerItems: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});

const styles = StyleSheet.create({
  container: {
    marginTop: 5,
    marginBottom: 10,
  },
  wrapper: {
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    paddingTop: 6,
    paddingBottom: 6,
    paddingLeft: 10,
    paddingRight: 10,
    borderRadius: 15,
  },
  text: {
    color: Color.white,
    fontSize: 12,
    fontWeight: '600',
  },
});

dayjs.extend(relativeTime);
dayjs.extend(calendar);

export function Day({
  dateFormat = DATE_FORMAT,
  dateFormatCalendar,
  createdAt,
  containerStyle,
  wrapperStyle,
  textStyle,
}: DayProps) {
  const { getLocale } = useChatContext();

  const dateStr = useMemo(() => {
    if (createdAt == null) return null;

    const now = dayjs().startOf('day');
    const date = dayjs(createdAt).locale(getLocale()).startOf('day');

    if (!now.isSame(date, 'year')) return date.format('D MMMM YYYY');

    if (now.diff(date, 'day') < 1)
      return date.calendar(now, {
        sameDay: '[Today]',
        ...dateFormatCalendar,
      });

    return date.format(dateFormat);
  }, [createdAt, dateFormat, getLocale, dateFormatCalendar]);

  if (!dateStr) return null;

  return (
    <View style={[stylesCommon.centerItems, styles.container, containerStyle]}>
      <View style={[styles.wrapper, wrapperStyle]}>
        <Text style={[styles.text, textStyle]}>{dateStr}</Text>
      </View>
    </View>
  );
}
