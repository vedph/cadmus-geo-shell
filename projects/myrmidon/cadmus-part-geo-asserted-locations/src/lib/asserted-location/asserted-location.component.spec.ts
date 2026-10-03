import { Component, input, model, output } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { ThesaurusEntry } from '@myrmidon/cadmus-core';
import { Assertion, AssertionComponent } from '@myrmidon/cadmus-refs-assertion';
import { LookupProviderOptions } from '@myrmidon/cadmus-refs-lookup';
import { GeoLocation, GeoLocationEditor } from '@myrmidon/cadmus-geo-location';

import { AssertedLocationComponent } from './asserted-location.component';
import { AssertedLocation } from '../asserted-locations-part';

// lightweight stand-ins for the heavy child editors (the geo-location editor
// creates a MapLibre map, which requires WebGL unavailable in jsdom)
@Component({ selector: 'cadmus-geo-location-editor', template: '' })
class MockGeoLocationEditor {
  public readonly location = model<GeoLocation | undefined>();
  public readonly cancelEdit = output<void>();
}

@Component({ selector: 'cadmus-refs-assertion', template: '' })
class MockAssertionComponent {
  public readonly assertion = model<Assertion | undefined>();
  public readonly assTagEntries = input<ThesaurusEntry[] | undefined>();
  public readonly refTypeEntries = input<ThesaurusEntry[] | undefined>();
  public readonly refTagEntries = input<ThesaurusEntry[] | undefined>();
  public readonly lookupProviderOptions = input<
    LookupProviderOptions | undefined
  >();
}

const GEO: GeoLocation = {
  label: 'Rome',
  latitude: 41.9,
  longitude: 12.5,
};

const ASSERTION: Assertion = {
  rank: 1,
  tag: 'ass-tag',
  references: [{ citation: 'Liv. 1.1', type: 'book' }],
};

const TAG_ENTRIES: ThesaurusEntry[] = [
  { id: 'capital', value: 'capital' },
  { id: 'village', value: 'village' },
];

describe('AssertedLocationComponent', () => {
  let component: AssertedLocationComponent;
  let fixture: ComponentFixture<AssertedLocationComponent>;

  const setLocation = async (location?: AssertedLocation) => {
    fixture.componentRef.setInput('location', location);
    await fixture.whenStable();
  };

  const geoEditor = (): MockGeoLocationEditor =>
    fixture.debugElement.query(By.directive(MockGeoLocationEditor))
      .componentInstance;

  const assertionEditor = (): MockAssertionComponent | undefined =>
    fixture.debugElement.query(By.directive(MockAssertionComponent))
      ?.componentInstance;

  beforeEach(async () => {
    TestBed.overrideComponent(AssertedLocationComponent, {
      remove: { imports: [GeoLocationEditor, AssertionComponent] },
      add: { imports: [MockGeoLocationEditor, MockAssertionComponent] },
    });
    await TestBed.configureTestingModule({
      imports: [AssertedLocationComponent],
      providers: [provideNoopAnimations()],
    }).compileComponents();

    fixture = TestBed.createComponent(AssertedLocationComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create with an empty invalid form', () => {
    expect(component).toBeTruthy();
    expect(component.form.value().value()).toBeNull();
    expect(component.form.hasAssertion().value()).toBe(false);
    expect(component.form.assertion().value()).toBeNull();
    expect(component.form.tag().value()).toBe('');
    expect(component.form().invalid()).toBe(true);
  });

  it('should render no <form> element', () => {
    expect(fixture.nativeElement.querySelector('form')).toBeNull();
  });

  describe('updating form from location', () => {
    it('should fill the form from a location without assertion', async () => {
      await setLocation({ value: GEO, tag: 'capital' });

      expect(component.form.value().value()).toEqual(GEO);
      expect(component.form.hasAssertion().value()).toBe(false);
      expect(component.form.assertion().value()).toBeNull();
      expect(component.form.tag().value()).toBe('capital');
      expect(component.form().valid()).toBe(true);
      expect(component.form().dirty()).toBe(false);
    });

    it('should fill the form from a location with assertion', async () => {
      await setLocation({ value: GEO, assertion: ASSERTION });

      expect(component.form.hasAssertion().value()).toBe(true);
      expect(component.form.assertion().value()).toEqual(ASSERTION);
      expect(component.form.tag().value()).toBe('');
    });

    it('should reset the form when location is cleared', async () => {
      await setLocation({ value: GEO, tag: 'x', assertion: ASSERTION });
      await setLocation(undefined);

      expect(component.form.value().value()).toBeNull();
      expect(component.form.hasAssertion().value()).toBe(false);
      expect(component.form.assertion().value()).toBeNull();
      expect(component.form.tag().value()).toBe('');
    });

    it('should not adopt the bound location objects', async () => {
      await setLocation({ value: GEO, assertion: ASSERTION });
      expect(component.form.value().value()).not.toBe(GEO);
      expect(component.form.assertion().value()).not.toBe(ASSERTION);
    });

    it('should pass the location value to the geo-location editor', async () => {
      await setLocation({ value: GEO });
      expect(geoEditor().location()).toEqual(GEO);
    });
  });

  describe('template', () => {
    it('should show "no location" when there is no value', () => {
      const desc = fixture.nativeElement.querySelector(
        'mat-panel-description',
      ) as HTMLElement;
      expect(desc.textContent).toContain('no location');
    });

    it('should show label and coordinates when there is a value', async () => {
      await setLocation({ value: GEO });
      const desc = fixture.nativeElement.querySelector(
        'mat-panel-description',
      ) as HTMLElement;
      expect(desc.textContent).toContain('Rome (41.9, 12.5)');
    });

    it('should use a free text tag input when no tag entries', () => {
      expect(fixture.nativeElement.querySelector('mat-select')).toBeNull();
      expect(
        fixture.nativeElement.querySelector('input[matInput]'),
      ).not.toBeNull();
    });

    it('should use a tag select when tag entries are set', async () => {
      fixture.componentRef.setInput('locTagEntries', TAG_ENTRIES);
      await fixture.whenStable();
      expect(fixture.nativeElement.querySelector('mat-select')).not.toBeNull();
      expect(fixture.nativeElement.querySelector('input[matInput]')).toBeNull();
    });

    it('should show error for a too long free tag', async () => {
      // mat-error is displayed only when the control is in error state,
      // i.e. invalid and touched
      component.form.tag().value.set('x'.repeat(51));
      component.form.tag().markAsTouched();
      await fixture.whenStable();

      expect(component.form.tag().getError('maxLength')).toBeTruthy();
      const error = fixture.nativeElement.querySelector('mat-error');
      expect(error?.textContent).toContain('tag too long');
    });

    it('should show the assertion editor only when hasAssertion is checked', async () => {
      expect(assertionEditor()).toBeUndefined();

      fixture.componentRef.setInput('assTagEntries', TAG_ENTRIES);
      await setLocation({ value: GEO, assertion: ASSERTION });

      const editor = assertionEditor()!;
      expect(editor).toBeTruthy();
      expect(editor.assertion()).toEqual(ASSERTION);
      expect(editor.assTagEntries()).toEqual(TAG_ENTRIES);
    });

    it('should disable save button when form is pristine or invalid', async () => {
      const saveBtn = (): HTMLButtonElement =>
        fixture.nativeElement.querySelector(
          'button[mattooltip="Save asserted location"]',
        );
      expect(saveBtn().type).toBe('button');
      expect(saveBtn().disabled).toBe(true);

      await setLocation({ value: GEO });
      expect(saveBtn().disabled).toBe(true);

      component.form.tag().value.set('t');
      component.form.tag().markAsDirty();
      await fixture.whenStable();
      expect(saveBtn().disabled).toBe(false);
    });

    it('should become pristine again when the edit is reverted', async () => {
      await setLocation({ value: GEO, tag: 'a' });
      component.form.tag().value.set('b');
      component.form.tag().markAsDirty();
      await fixture.whenStable();
      expect(component.form().dirty()).toBe(true);

      component.form.tag().value.set('a');
      await fixture.whenStable();
      expect(component.form().dirty()).toBe(false);
    });
  });

  describe('child editors events', () => {
    it('should update value and collapse panel on location change', async () => {
      component.onLocationToggle(true);
      expect(component.locationExpanded()).toBe(true);

      geoEditor().location.set(GEO);
      await fixture.whenStable();

      expect(component.form.value().value()).toEqual(GEO);
      expect(component.form.value().dirty()).toBe(true);
      expect(component.locationExpanded()).toBe(false);
      expect(component.form().valid()).toBe(true);
    });

    it('should collapse panel on location editor cancel', async () => {
      component.onLocationToggle(true);
      geoEditor().cancelEdit.emit();
      await fixture.whenStable();
      expect(component.locationExpanded()).toBe(false);
    });

    it('should update assertion on assertion change', async () => {
      await setLocation({ value: GEO, assertion: ASSERTION });
      const changed: Assertion = { ...ASSERTION, rank: 3 };

      assertionEditor()!.assertion.set(changed);
      await fixture.whenStable();

      expect(component.form.assertion().value()).toEqual(changed);
      expect(component.form.assertion().dirty()).toBe(true);
    });

    it('should stay pristine on an assertion echo', async () => {
      // server data often contain nulls...
      const assertion = { ...ASSERTION, note: null } as unknown as Assertion;
      await setLocation({ value: GEO, assertion });
      // ...and the child autosaves a normalized copy of what it received
      assertionEditor()!.assertion.set({ ...ASSERTION, note: undefined });
      await fixture.whenStable();

      expect(component.form().dirty()).toBe(false);
    });

    it('should set assertion to null when assertion is cleared', () => {
      component.onAssertionChange(ASSERTION);
      component.onAssertionChange(undefined);
      expect(component.form.assertion().value()).toBeNull();
    });
  });

  describe('close', () => {
    it('should emit editorClose on close', () => {
      let closed = false;
      component.editorClose.subscribe(() => (closed = true));
      component.close();
      expect(closed).toBe(true);
    });

    it('should emit editorClose when clicking close button', () => {
      let closed = false;
      component.editorClose.subscribe(() => (closed = true));
      (
        fixture.nativeElement.querySelector(
          'button[type="button"][mattooltip="Close"]',
        ) as HTMLButtonElement
      ).click();
      expect(closed).toBe(true);
    });
  });

  describe('save', () => {
    it('should not save when form is invalid', () => {
      let saved: AssertedLocation | undefined;
      component.location.subscribe((l) => (saved = l));
      component.save();
      expect(saved).toBeUndefined();
      expect(component.location()).toBeUndefined();
      expect(component.form.value().touched()).toBe(true);
    });

    it('should save location with trimmed tag and assertion', async () => {
      await setLocation({ value: GEO });
      component.form.tag().value.set('  capital  ');
      component.form.hasAssertion().value.set(true);
      component.onAssertionChange(ASSERTION);

      let saved: AssertedLocation | undefined;
      component.location.subscribe((l) => (saved = l));
      component.save();

      const expected: AssertedLocation = {
        value: GEO,
        tag: 'capital',
        assertion: ASSERTION,
      };
      expect(saved).toEqual(expected);
      expect(component.location()).toEqual(expected);
    });

    it('should drop assertion when hasAssertion is unchecked', async () => {
      await setLocation({ value: GEO, assertion: ASSERTION });
      component.form.hasAssertion().value.set(false);
      component.save();
      expect(component.location()!.assertion).toBeUndefined();
    });

    it('should drop assertion when hasAssertion is checked but empty', async () => {
      await setLocation({ value: GEO });
      component.form.hasAssertion().value.set(true);
      component.save();
      expect(component.location()!.assertion).toBeUndefined();
    });

    it('should save an empty tag as undefined', async () => {
      await setLocation({ value: GEO, tag: 'x' });
      component.form.tag().value.set('   ');
      component.save();
      expect(component.location()!.tag).toBeUndefined();
    });

    it('should save on save button click', async () => {
      await setLocation({ value: GEO });
      component.form.tag().value.set('t');
      component.form.tag().markAsDirty();
      await fixture.whenStable();

      (
        fixture.nativeElement.querySelector(
          'button[mattooltip="Save asserted location"]',
        ) as HTMLButtonElement
      ).click();
      expect(component.location()).toEqual({ value: GEO, tag: 't' });
    });

    const pressEnter = (input: HTMLInputElement): KeyboardEvent => {
      const event = new KeyboardEvent('keydown', {
        key: 'Enter',
        bubbles: true,
        cancelable: true,
      });
      input.dispatchEvent(event);
      return event;
    };

    it('should save on Enter in the tag input', async () => {
      await setLocation({ value: GEO });
      component.form.tag().value.set('t');
      component.form.tag().markAsDirty();
      await fixture.whenStable();

      const event = pressEnter(
        fixture.nativeElement.querySelector('input[matInput]'),
      );
      expect(event.defaultPrevented).toBe(true);
      expect(component.location()).toEqual({ value: GEO, tag: 't' });
    });

    it('should not save on Enter when unchanged', async () => {
      const location: AssertedLocation = { value: GEO, tag: 't' };
      await setLocation(location);

      pressEnter(fixture.nativeElement.querySelector('input[matInput]'));
      expect(component.location()).toBe(location);
    });

    it('should save a location carrying no Symbol tags', async () => {
      await setLocation({ value: GEO, assertion: ASSERTION });
      component.form.tag().value.set('t');
      component.save();

      const saved = component.location()!;
      const symbols = (o: object) => Object.getOwnPropertySymbols(o).length;
      expect(symbols(saved.value)).toBe(0);
      expect(saved.assertion!.references!.every((r) => !symbols(r))).toBe(
        true,
      );
    });
  });
});
