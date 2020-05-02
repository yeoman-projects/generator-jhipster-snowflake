const glob = require('glob');
const fs = require('fs');

const TPL = 'template';

// const changeset = (changelogDate, entityTableName, includesDefaults) => {
//   const createdByDefaultValue = includesDefaults === true ? ' defaultValue="system"' : '';
//   // eslint-disable-next-line no-template-curly-in-string
//   const createdDateDefaultValue = includesDefaults === true ? ' defaultValueDate="${now}"' : '';
//   return `
//     <!-- Added the entity snowflake columns -->
//     <changeSet id="${changelogDate}-snowflake-1" author="jhipster-snowflake">
//         <addColumn tableName="${entityTableName}">
//             <column name="created_by" type="varchar(50)"${createdByDefaultValue}>
//                 <constraints nullable="false"/>
//             </column>
//             <column name="created_date" type="timestamp"${createdDateDefaultValue}>
//                 <constraints nullable="false"/>
//             </column>
//             <column name="last_modified_by" type="varchar(50)"/>
//             <column name="last_modified_date" type="timestamp"/>
//         </addColumn>
//     </changeSet>`;
// };

const copyFiles = (gen, files) => {
  files.forEach((file) => {
    gen.copyTemplate(file.from, file.to, file.type ? file.type : TPL, gen, file.interpolate ? {
      interpolate: file.interpolate
    } : undefined);
  });
};

const updateEntitySnowflake = function (entityName, entityData, javaDir, resourceDir, updateIndex = false, skipFakeData = false) {
  const entityXmlPath = `${resourceDir}config/liquibase/changelog/${entityData.changelogDate}_added_entity_${entityName}.xml`;
  const entityConstraintXmlPath = `${resourceDir}config/liquibase/changelog/${entityData.changelogDate}_added_entity_constraints_${entityName}.xml`;
  const entityLineName = toLine(entityName);
  const replaceContents = [
    {
      path: entityXmlPath,
      from: '<property name="autoIncrement" value="true"/>',
      to: ''
    },
    {
      path: entityXmlPath,
      from: '<column name="id" type="bigint" autoIncrement="${autoIncrement}">',
      to: '<column name="id" type="varchar(32)">'
    },
    {
      path: entityXmlPath,
      from: '<column name="id" type="numeric"/>',
      to: '<column name="id" type="string"/>'
    },
    {
      path: `${javaDir}domain/${entityName}.java`,
      from: `    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @org.springframework.data.elasticsearch.annotations.Field(type = FieldType.Keyword)
    private Long id;`,
      to: `    @org.springframework.data.elasticsearch.annotations.Field(type = FieldType.Keyword)
    private String id;`,
    },
    {
      path: `${javaDir}domain/${entityName}.java`,
      from: `    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;`,
      to: `    @Id
    private String id;`,
    },
    {
      path: `${javaDir}domain/${entityName}.java`,
      from: 'public Long getId(',
      to: 'public String getId('
    },
    {
      path: `${javaDir}domain/${entityName}.java`,
      from: 'public void setId(Long id',
      to: 'public void setId(String id'
    },
    {
      path: `${javaDir}repository/search/${entityName}SearchRepository.java`,
      from: `public interface ${entityName}SearchRepository extends ElasticsearchRepository<${entityName}, Long>`,
      to: `public interface ${entityName}SearchRepository extends ElasticsearchRepository<${entityName}, String>`
    },
    {
      path: `${javaDir}repository/${entityName}Repository.java`,
      from: `public interface ${entityName}Repository extends JpaRepository<${entityName}, Long>`,
      to: `public interface ${entityName}Repository extends JpaRepository<${entityName}, String>`
    },
    {
      path: `${javaDir}service/dto/${entityName}DTO.java`,
      from: 'private Long id;',
      to: 'private String id;'
    },
    {
      path: `${javaDir}service/dto/${entityName}DTO.java`,
      from: 'public Long getId(',
      to: 'public String getId('
    },
    {
      path: `${javaDir}service/dto/${entityName}DTO.java`,
      from: 'public void setId(Long id',
      to: 'public void setId(String id'
    },
    {
      path: `${javaDir}service/dto/${entityName}Criteria.java`,
      from: 'private LongFilter id;',
      to: 'private StringFilter id;'
    },
    {
      path: `${javaDir}service/dto/${entityName}Criteria.java`,
      from: 'public LongFilter getId(',
      to: 'public StringFilter getId('
    },
    {
      path: `${javaDir}service/dto/${entityName}Criteria.java`,
      from: 'public void setId(LongFilter id',
      to: 'public void setId(StringFilter id'
    },
    {
      path: `${javaDir}service/impl/${entityName}ServiceImpl.java`,
      from: `public Optional<${entityName}DTO> findOne(Long id`,
      to: `public Optional<${entityName}DTO> findOne(String id`
    },
    {
      path: `${javaDir}service/impl/${entityName}ServiceImpl.java`,
      from: `public void delete(Long id`,
      to: `public void delete(String id`
    },
    {
      path: `${javaDir}service/mapper/${entityName}Mapper.java`,
      from: `default ${entityName} fromId(Long id`,
      to: `default ${entityName} fromId(String id`
    },
    {
      path: `${javaDir}service/${entityName}QueryService.java`,
      from: `specification = specification.and(buildRangeSpecification(criteria.getId()`,
      to: `specification = specification.and(buildStringSpecification(criteria.getId()`
    },
    {
      path: `${javaDir}service/${entityName}Service.java`,
      from: `Optional<${entityName}DTO> findOne(Long id`,
      to: `Optional<${entityName}DTO> findOne(String id`,
    },
    {
      path: `${javaDir}service/${entityName}Service.java`,
      from: `void delete(Long id`,
      to: `void delete(String id`,
    },
    {
      path: `${javaDir}web/rest/${entityName}Resource.java`,
      from: `public ResponseEntity<${entityName}DTO> get${entityName}(@PathVariable Long id`,
      to: `public ResponseEntity<${entityName}DTO> get${entityName}(@PathVariable String id`,
    },
    {
      path: `${javaDir}web/rest/${entityName}Resource.java`,
      from: `public ResponseEntity<Void> delete${entityName}(@PathVariable Long id`,
      to: `ResponseEntity<Void> delete${entityName}(@PathVariable String id`,
    },
    {
      path: `${javaDir}web/rest/${entityName}Resource.java`,
      from: `return ResponseEntity.noContent().headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id.toString()`,
      to: `return ResponseEntity.noContent().headers(HeaderUtil.createEntityDeletionAlert(applicationName, true, ENTITY_NAME, id`,
    },
    {
      path: `${javaDir}web/rest/${entityName}Resource.java`,
      from: `public ResponseEntity<Void> delete${entityName}(@PathVariable Long id`,
      to: `ResponseEntity<Void> delete${entityName}(@PathVariable String id`,
    },
    {
      path: `${javaDir}web/rest/${entityName}Resource.java`,
      from: `throw new BadRequestAlertException("A new ${entityData.entityTableName} cannot already have an ID", ENTITY_NAME, "idexists");
        }
        ${entityName}DTO result = ${entityData.entityTableName}Service.save(${entityData.entityTableName}DTO);`,
      to: `throw new BadRequestAlertException("A new ${entityData.entityTableName} cannot already have an ID", ENTITY_NAME, "idexists");
        }
        ${entityData.entityTableName}DTO.setId(SnowFlake.nextIdString());
        ${entityName}DTO result = ${entityData.entityTableName}Service.save(${entityData.entityTableName}DTO);`,
    },
    // com/deep/cheetah
    // this.jhAppConfig.packageFolder
    // /Users/snowfox/Developer/deepfundation/microservices/cheetah/src/test/java/com/deep/cheetah/service/mapper/AreaMapperTest.java
    {
      path: `src/test/java/${this.jhAppConfig.packageFolder}/service/mapper/${entityName}MapperTest.java`,
      from: `Long id = 2L;`,
      to: `String id = 2L;`,
    }
  ]

  if (entityData.relationships) {
    entityData.relationships.forEach(item => {
      const relationshipClassName = replaceFirstUper(item.relationshipName);
      const relationshipLineName = toLine(item.relationshipName);
      if (item.relationshipType === 'many-to-one' || item.relationshipType === 'one-to-one') {
        replaceContents.push({
          path: entityXmlPath,
          from: `<column name="${relationshipLineName}_id" type="bigint">`,
          to: `<column name="${relationshipLineName}_id" type="varchar(32)">`,
        });
        replaceContents.push({
          path: `${javaDir}service/dto/${entityName}DTO.java`,
          from: `private Long ${item.relationshipName}Id;`,
          to: `private String ${item.relationshipName}Id;`,
        });
        replaceContents.push({
          path: `${javaDir}service/dto/${entityName}DTO.java`,
          from: `public Long get${relationshipClassName}Id(`,
          to: `public String get${relationshipClassName}Id(`,
        });
        replaceContents.push({
          path: `${javaDir}service/dto/${entityName}DTO.java`,
          from: `public void set${relationshipClassName}Id(Long ${item.otherEntityName}Id`,
          to: `public void set${relationshipClassName}Id(String ${item.otherEntityName}Id`
        });
        replaceContents.push( {
          path: `${javaDir}service/dto/${entityName}Criteria.java`,
          from: `private LongFilter ${item.relationshipName}Id;`,
          to: `private StringFilter ${item.relationshipName}Id;`,
        });
        replaceContents.push( {
          path: `${javaDir}service/dto/${entityName}Criteria.java`,
          from: `public LongFilter get${relationshipClassName}Id(`,
          to: `public StringFilter get${relationshipClassName}Id(`,
        });
        replaceContents.push( {
          path: `${javaDir}service/dto/${entityName}Criteria.java`,
          from: `public void set${relationshipClassName}Id(LongFilter ${item.relationshipName}Id`,
          to: `public void set${relationshipClassName}Id(StringFilter ${item.relationshipName}Id`,
        });
      }
    });
  }
  if (!this.fs.read(`${javaDir}web/rest/${entityName}Resource.java`, {
    defaults: ''
  }).includes(`import ${this.jhAppConfig.packageName}.util.SnowFlake;`)){
    replaceContents.push( {
      path: `${javaDir}web/rest/${entityName}Resource.java`,
      from: `import ${this.jhAppConfig.packageName}.service.${entityName}Service;`,
      to: `import ${this.jhAppConfig.packageName}.service.${entityName}Service;
import ${this.jhAppConfig.packageName}.util.SnowFlake;`,
    });
  }

  // 下面是转换表名为连字符的代码
  replaceContents.push({
    path: `${javaDir}domain/${entityName}.java`,
    from: `@Table(name = "${entityData.entityTableName}"`,
    to: `@Table(name = "${entityLineName}"`
  });
  replaceContents.push({
    path: entityXmlPath,
    from: RegExp(`tableName="${entityData.entityTableName}"`, 'g'),
    to: `tableName="${entityLineName}"`,
    regex: true
  });
  if (fs.existsSync(entityConstraintXmlPath)) {
    const regex = new RegExp(`baseTableName="${entityData.entityTableName}"`, 'g')
    replaceContents.push({
      path: entityConstraintXmlPath,
      from: regex,
      to: `baseTableName="${entityLineName}"`,
      regex: true
    });
    if (entityData.relationships) {
      entityData.relationships.forEach(item => {
        const otherEntityLineName = toLine(item.otherEntityName);
        replaceContents.push( {
          path: entityConstraintXmlPath,
          from: `referencedTableName="${item.otherEntityName}"`,
          to: `referencedTableName="${otherEntityLineName}"`
        });
      })
    }
  }

  replaceContents.forEach(item => {
    this.replaceContent(item.path, item.from, item.to, item.regex);
  });
  
  // extend entity with AbstractSnowflakeingEntity
  // if (!this.fs.read(`${javaDir}domain/${entityName}.java`, {
  //   defaults: ''
  // }).includes('extends AbstractSnowflakeingEntity')) {
  //   this.replaceContent(`${javaDir}domain/${entityName}.java`, `public class ${entityName}`, `public class ${entityName} extends AbstractSnowflakeingEntity`);
  // }
  // // extend DTO with AbstractSnowflakeingDTO
  // if (entityData.dto === 'mapstruct') {
  //   if (!this.fs.read(`${javaDir}service/dto/${entityName}DTO.java`, {
  //     defaults: ''
  //   }).includes('extends AbstractSnowflakeingDTO')) {
  //     this.replaceContent(`${javaDir}service/dto/${entityName}DTO.java`, `public class ${entityName}DTO`, `public class ${entityName}DTO extends AbstractSnowflakeingDTO`);
  //   }
  // }
  // // update liquibase changeset
  // const file = glob.sync(`${resourceDir}/config/liquibase/changelog/*_added_entity_${entityName}.xml`)[0];
  // const entityTableName = entityData.entityTableName ? entityData.entityTableName : entityName;
  // this.addChangesetToLiquibaseEntityChangelog(file, changeset(this.changelogDate, this.getTableName(entityTableName), !skipFakeData));
  // if (this.snowflakeFramework === 'javers') {
  //   // check if repositories are already annotated
  //   const snowflakeTableAnnotation = '@JaversSpringDataSnowflakeable';
  //   const pattern = new RegExp(snowflakeTableAnnotation, 'g');
  //   const content = this.fs.read(`${javaDir}repository/${entityName}Repository.java`, 'utf8');

  //   if (!pattern.test(content)) {
  //     // add javers annotations to repository
  //     if (!this.fs.read(`${javaDir}repository/${entityName}Repository.java`, {
  //       defaults: ''
  //     }).includes('@JaversSpringDataSnowflakeable')) {
  //       this.replaceContent(`${javaDir}repository/${entityName}Repository.java`, `public interface ${entityName}Repository`, `@JaversSpringDataSnowflakeable\npublic interface ${entityName}Repository`);
  //       this.replaceContent(`${javaDir}repository/${entityName}Repository.java`, `domain.${entityName};`, `domain.${entityName};\nimport org.javers.spring.annotation.JaversSpringDataSnowflakeable;`);
  //     }

  //     // this is used from :entity subgenerator to update the list of
  //     // snowflake entities (if snowflake page available) in `#getSnowflakeEntities`
  //     // method in `JaversEntitySnowflakeResource` class, in case that list
  //     // has changed after running the generator
  //     if (updateIndex && this.fs.exists(`${javaDir}web/rest/JaversEntitySnowflakeResource.java`)) {
  //       const files = [{
  //         from: `${this.javaTemplateDir}/web/rest/_JaversEntitySnowflakeResource.java`,
  //         to: `${javaDir}web/rest/JaversEntitySnowflakeResource.java`
  //       }];
  //       copyFiles(this, files);
  //     }
  //   }
  // }
};

  /**
   * 把首字母变成大写 demoTest to DemoTest
   * @param string str 
   */
  function replaceFirstUper(str)  
  {     
    return str.substr(0, 1).toLocaleUpperCase() + str.substr(1);
      // str = str.toLowerCase();     
      // return str.replace(/\b(\w)|\s(\w)/g, function(m){  
      //     return m.toUpperCase();  
      // });    
  }

  // 驼峰转换下划线
function toLine(name) {
  var str = name.replace(/([A-Z])/g,"_$1").toLowerCase();
  if (str[0] === '_') {
    str = str.substr(1);
  }
  return str;
}

module.exports = {
  // changeset,
  copyFiles,
  updateEntitySnowflake
};
