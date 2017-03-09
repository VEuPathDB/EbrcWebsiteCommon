let MONTHS = [ 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sept', 'Oct', 'Nov', 'Dec' ];

/**
 * format release date string
 */
export function formatReleaseDate(releaseDateString) {
  let date = new Date(releaseDateString);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`
}
