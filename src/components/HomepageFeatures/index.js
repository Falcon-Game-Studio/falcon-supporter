import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';

const FeatureList = [
  {
    title: 'AI Agent thông minh',
    Svg: require('@site/static/img/undraw_docusaurus_mountain.svg').default,
    description: (
      <>
        AI tự động phân tích tin nhắn, tra cứu Knowledge Base và đề xuất
        giải pháp cho các vấn đề quen thuộc.
      </>
    ),
  },
  {
    title: 'Auto Pull Request',
    Svg: require('@site/static/img/undraw_docusaurus_tree.svg').default,
    description: (
      <>
        Với các tình huống đã biết, AI tự động tạo Pull Request sửa DB
        để đội CSKH review và approve.
      </>
    ),
  },
  {
    title: 'Học tập liên tục',
    Svg: require('@site/static/img/undraw_docusaurus_react.svg').default,
    description: (
      <>
        Mỗi case được resolve thành công đều trở thành dữ liệu huấn luyện,
        giúp AI ngày càng xử lý tốt hơn.
      </>
    ),
  },
];

function Feature({Svg, title, description}) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures() {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props, idx) => (
            <Feature key={idx} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
