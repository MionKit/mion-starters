import {Link} from 'react-router';
import styles from './HomePage.module.css';

export default function HomePage() {
    return (
        <div className={styles.pageWrapper}>
            <main className={styles.pageMain}>
                <div className={styles.logos}>
                    <img src="/react.svg" alt="React logo" height="60" />
                    <span className={styles.logoSeparator}>+</span>
                    <picture>
                        <source srcSet="/mion-logo-dark.svg" media="(prefers-color-scheme: dark)" />
                        <img src="/mion-logo.svg" alt="Mion logo" height="60" />
                    </picture>
                </div>
                <div className={styles.contentSection}>
                    <h1>To get started, edit the pages.</h1>
                    <p>
                        Looking for a starting point? Head over to the{' '}
                        <a href="https://react.dev/learn" target="_blank" rel="noopener noreferrer">
                            React Documentation
                        </a>{' '}
                        or the{' '}
                        <a href="https://mion.io" target="_blank" rel="noopener noreferrer">
                            Mion Docs
                        </a>
                        .
                    </p>
                </div>
                <div className={styles.actions}>
                    <Link className={`${styles.btn} ${styles.btnPrimary}`} to="/mion-orders">
                        Mion Showcase
                    </Link>
                    <a
                        className={`${styles.btn} ${styles.btnSecondary}`}
                        href="https://react.dev/learn"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        Documentation
                    </a>
                </div>
            </main>
        </div>
    );
}
