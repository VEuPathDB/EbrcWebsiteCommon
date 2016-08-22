package org.eupathdb.common.db;

import java.util.Properties;

import org.apache.log4j.Logger;
import org.gusdb.fgputil.db.pool.DbDriverInitializer;

public class EuPathDbDriverInitializer implements DbDriverInitializer {

	public static final Logger LOG = Logger.getLogger(EuPathDbDriverInitializer.class);
	
	/* Remove setup for JavaMelody due to problems detailed in Redmine 17615 */
	//private static final String MELODY_DRIVER = "net.bull.javamelody.JdbcDriver";
	
	/* Remove setup for Log4Jdbc due to problems detailed in Redmine 14576 */
	//private static final String LOG4JDBC_DRIVER = "net.sf.log4jdbc.DriverSpy";
	//private static final String LOG4JDBC_URL_PREFIX = "jdbc:log4";
	
	@Override
	public String initializeDriver(String driverClassName, String connectionUrl, Properties props) throws ClassNotFoundException {
		
		LOG.debug("Initializing Model-Specified driver: " + driverClassName);
		Class.forName(driverClassName);
		
		// NOTE!!  The order of the registration of these drivers is important.  Log4Jdbc first, then Melody
		//LOG.debug("Initializing Log4Jdbc proxy driver.");
		//Class.forName(LOG4JDBC_DRIVER);
		
		//LOG.debug("Initializing Java Melody JDBC driver.");
		//Class.forName(MELODY_DRIVER);
		
		//LOG.debug("Specifying native JDBC driver to Melody (" + driverClassName + ").");
		//props.put("driver", driverClassName);
		
		//LOG.debug("Prepending Log4Jdbc URL prefix onto connection URL.");
		//connectionUrl = LOG4JDBC_URL_PREFIX + connectionUrl;
		
		return connectionUrl;
	}

}
