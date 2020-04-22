const chalk = require('chalk');
const BaseGenerator = require('generator-jhipster/generators/generator-base');
const jhipsterConstants = require('generator-jhipster/generators/generator-constants');

const genUtils = require('../utils');
const packagejs = require('../../package.json');

module.exports = class extends BaseGenerator {
  get initializing() {
    return {
      readConfig() {
        // this.entityConfig = this.options.entityConfig;
        const context = this.options.jhipsterContext.context;
        const jsonObj = this.fs.readJSON(`.jhipster/${context.name}.json`);
        if (!jsonObj) {
          this.env.error(`${chalk.red.bold('ERROR!')} The configuration file could not be found.\n.jhipster/${context.name}.json\n`);
        }
        this.entityJson = jsonObj
        // console.log('------------');
        // console.log(JSON.stringify(this.options.jhipsterContext.context));
        this.jhAppConfig = this.getAllJhipsterConfig();
        if (!this.jhAppConfig) {
          this.error('Can\'t read .yo-rc.json');
        }
      },
      setSource() {
        this.sourceRoot(`${this.sourceRoot()}/../../app/templates`);
      },

      // checkDBType() {
      //   if (this.jhAppConfig.databaseType !== 'sql' && this.jhAppConfig.databaseType !== 'mongodb') {
      //     // exit if DB type is not SQL or MongoDB
      //     this.abort = true;
      //   }
      // },

      displayLogo() {
        if (this.abort) {
          return;
        }
        this.log(chalk.white(`Running ${chalk.bold('JHipster Entity Snowflake')} Generator! ${chalk.yellow(`v${packagejs.version}\n`)}`));
      },

      validate() {
        // this shouldnt be run directly
        if (!this.entityConfig && !this.entityJson) {
          this.env.error(`${chalk.red.bold('ERROR!')} This sub generator should be used only from JHipster and cannot be run directly...\n`);
        }
      },

      getSnowflakeEntities() {
        this.snowflakeEntities = this.getExistingEntities()
          .filter(entity => entity.definition.enableEntitySnowflake)
          .map(entity => entity.name);
      }
    };
  }

  prompting() {
    if (this.abort) {
      return;
    }

    // don't prompt if data are imported from a file
    // if (this.entityConfig.useConfigurationFile === true && this.entityConfig.data && typeof this.entityConfig.data.enableEntitySnowflake !== 'undefined') {
    //   this.enableSnowflake = this.entityConfig.data.enableEntitySnowflake;

    //   if (typeof this.config.get('snowflakeFramework') !== 'undefined') {
    //     this.snowflakeFramework = this.config.get('snowflakeFramework');
    //   } else {
    //     this.snowflakeFramework = 'custom';
    //   }
    //   return;
    // }
    if (this.entityJson.enableEntitySnowflake !== true) {
      return;
    }

    const done = this.async();
    // const entityName = this.entityConfig.entityClass;
    const entityName = this.entityJson.name;
    const prompts = [{
      type: 'confirm',
      name: 'enableSnowflake',
      message: `Do you want to enable snowflake for this entity(${entityName})?`,
      default: true
    }];

    this.prompt(prompts).then((props) => {
      this.props = props;
      // To access props later use this.props.someOption;
      this.enableSnowflake = props.enableSnowflake;
      this.snowflakeFramework = this.config.get('snowflakeFramework');
      if (this.enableSnowflake && !this.snowflakeEntities.includes(entityName)) {
        this.snowflakeEntities.push(entityName);
      }
      done();
    });
  }
  get writing() {
    return {

      updateFiles() {
        if (this.abort) {
          return;
        }
        if (!this.enableSnowflake) {
          return;
        }

        // read config from .yo-rc.json
        this.baseName = this.jhAppConfig.baseName;
        this.packageName = this.jhAppConfig.packageName;
        this.packageFolder = this.jhAppConfig.packageFolder;
        this.clientFramework = this.jhAppConfig.clientFramework;
        this.clientPackageManager = this.jhAppConfig.clientPackageManager;
        this.buildTool = this.jhAppConfig.buildTool;
        this.cacheProvider = this.jhAppConfig.cacheProvider;
        this.skipFakeData = this.jhAppConfig.skipFakeData;
        this.skipServer = this.jhAppConfig.skipServer;

        // use function in generator-base.js from generator-jhipster
        this.angularAppName = this.getAngularAppName();

        // use constants from generator-constants.js
        const javaDir = `${jhipsterConstants.SERVER_MAIN_SRC_DIR + this.packageFolder}/`;
        const resourceDir = jhipsterConstants.SERVER_MAIN_RES_DIR;
        this.javaTemplateDir = '.';

        // if (this.entityConfig.entityClass) {
        if (this.entityJson) {
          this.log(`\n${chalk.bold.green('I\'m updating the entity for snowflake ')}${chalk.bold.yellow(this.entityJson.name)}`);

          // const entityName = this.entityConfig.entityClass;
          const entityName = this.entityJson.name;
          // const jsonObj = (this.entityConfig.data === undefined ? { changelogDate: this.entityConfig.changelogDate, entityTableName: this.entityConfig.entityTableName } : this.entityConfig.data);
          const jsonObj = this.entityJson;
          // this.changelogDate = jsonObj.changelogDate || this.dateFormatForLiquibase();
          this.changelogDate = this.entityJson || this.dateFormatForLiquibase();
          if (!this.skipServer) {
            genUtils.updateEntitySnowflake.call(this, entityName, jsonObj, javaDir, resourceDir, true, this.skipFakeData);
          }
        }
      },
      updateConfig() {
        if (this.abort) {
          return;
        }
        // this.updateEntityConfig(this.entityConfig.filename, 'enableEntitySnowflake', this.enableSnowflake);
        const filename = `.jhipster/${this.entityJson.name}.json`;
        this.updateEntityConfig(filename, 'enableEntitySnowflake', this.enableSnowflake);
      }
    };
  }

  end() {
    if (this.abort) {
      return;
    }
    if (this.enableSnowflake) {
      this.log(`\n${chalk.bold.green('Entity snowflake enabled')}`);
    }
  }
};
