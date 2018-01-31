let MONTHS = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec' ];

/**
 * format release date string
 */
export function formatReleaseDate(releaseDateString, format) {
  const date = new Date(releaseDateString);
  return (typeof format === 'string' ? format : 'd m y')
    .replace('d', date.getDate())
    .replace('m', MONTHS[date.getMonth()])
    .replace('y', date.getFullYear());
}
