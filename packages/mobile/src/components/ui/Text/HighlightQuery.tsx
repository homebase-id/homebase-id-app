import React from 'react';
import { Text, StyleSheet } from 'react-native';

export const highlightQuery = (text: string | undefined, query: string | undefined | null) => {
  if (!query || !text || !(typeof text === 'string')) return text;

  const regEscape = (v: string) => v.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
  const strArr = text.split(new RegExp(regEscape(query), 'ig'));

  return strArr.map((str, index) => {
    if (index === strArr.length - 1) return str;

    return (
      <React.Fragment key={index}>
        <Text>{str}</Text>
        <Text style={styles.highlight}>{query}</Text>
      </React.Fragment>
    );
  });
};

const styles = StyleSheet.create({
  highlight: {
    backgroundColor: '#FFEB3B', // Equivalent to amber-200
    color: '#000', // Ensures text is readable over the yellow background
  },
});
