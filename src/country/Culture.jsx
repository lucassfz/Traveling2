// Aba "Cultura" do guia do país.
export function Culture({ country }) {
  return (
    <>
      <section className="content-section" aria-labelledby="food-title">
        <h3 className="section-heading" id="food-title">Sabores</h3>
        <div className="stack" id="food-content">
          {(country.foods ?? []).map(item => (
            <article className="culture-row" key={item.name}>
              <div className="culture-row__icon" aria-hidden="true">{item.e || '🍽️'}</div>
              <div>
                <h4 className="culture-row__title">{item.name}</h4>
                <p className="culture-row__copy">{item.desc}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
      <section className="content-section" aria-labelledby="etiquette-title">
        <h3 className="section-heading" id="etiquette-title">Etiqueta</h3>
        <div className="stack" id="etiquette-content">
          {(country.etiquette ?? []).map(item => (
            <article className="culture-row" key={item.t}>
              <div className="culture-row__icon" aria-hidden="true">{item.e || '•'}</div>
              <p className="culture-row__copy">{item.t}</p>
            </article>
          ))}
        </div>
      </section>
      <div className="tag-list" id="vibe-content">{(country.vibe ?? []).map(value => <span className="tag" key={value}>{value}</span>)}</div>
    </>
  );
}
