interface AddressInputProps {
  address: string;
  onAddressChange: (address: string) => void;
}
import "./AddressInput.css";

function AddressInput({
  address,
  onAddressChange
}: AddressInputProps) {

  return (
    <div className="address-input-section">

      <label htmlFor="address">
        📌 Enter Nearby Address / Landmark
      </label>

      <input
        id="address"
        type="text"
        placeholder="e.g. Sindhi Colony, near XYZ School"
        value={address}
        onChange={(e) => onAddressChange(e.target.value)}
      />

    </div>
  );
}

export default AddressInput;